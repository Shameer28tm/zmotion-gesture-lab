/**
 * ZMotion Gesture Runner — Deterministic Core Game Engine
 * Pure TypeScript game logic: state machine, lane physics, obstacle generation,
 * collision detection, speed progression, and local high score persistence.
 */

export type RunnerGameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface Obstacle {
  id: number;
  lane: number; // -1 (Left), 0 (Center), 1 (Right)
  z: number; // Distance in front of player (moves towards 0)
  width: number;
  height: number;
  type: 'BARRIER' | 'PYLON' | 'ENERGY_ORB';
  passed: boolean;
  collected?: boolean;
}

export interface PlayerState {
  x: number; // Current horizontal position
  targetX: number;
  lane: number; // Current target lane (-1, 0, 1)
  y: number; // Vertical jump height (0 = grounded)
  vy: number; // Vertical jump velocity
  isJumping: boolean;
  tilt: number; // Banking angle when changing lanes
}

export interface RunnerConfig {
  initialSpeed: number;
  maxSpeed: number;
  speedAcceleration: number;
  laneDistance: number;
  gravity: number;
  jumpVelocity: number;
  playerCollisionRadius: number;
  spawnDistance: number;
  minObstacleSpacing: number;
}

export const DEFAULT_RUNNER_CONFIG: RunnerConfig = {
  initialSpeed: 22.0,
  maxSpeed: 45.0,
  speedAcceleration: 0.35, // Speed units gained per 100 meters
  laneDistance: 2.2, // Distance between lane centers
  gravity: 38.0, // Snappy arcade gravity
  jumpVelocity: 14.5,
  playerCollisionRadius: 0.65,
  spawnDistance: 70.0,
  minObstacleSpacing: 14.0,
};

const HIGH_SCORE_KEY = 'zmotion_runner_high_score';

export class RunnerEngine {
  private config: RunnerConfig;
  private state: RunnerGameState = 'IDLE';

  private player: PlayerState;
  private obstacles: Obstacle[] = [];
  private nextObstacleId = 1;

  private speed: number;
  private distance: number = 0;
  private score: number = 0;
  private highScore: number = 0;
  private multiplier: number = 1.0;

  constructor(config: Partial<RunnerConfig> = {}) {
    this.config = { ...DEFAULT_RUNNER_CONFIG, ...config };
    this.speed = this.config.initialSpeed;

    this.player = {
      x: 0,
      targetX: 0,
      lane: 0,
      y: 0,
      vy: 0,
      isJumping: false,
      tilt: 0,
    };

    this.highScore = this.loadHighScore();
  }

  public getState(): RunnerGameState {
    return this.state;
  }

  public getPlayer(): Readonly<PlayerState> {
    return this.player;
  }

  public getObstacles(): readonly Obstacle[] {
    return this.obstacles;
  }

  public getScore(): number {
    return Math.floor(this.score);
  }

  public getDistance(): number {
    return Math.floor(this.distance);
  }

  public getHighScore(): number {
    return this.highScore;
  }

  public getSpeed(): number {
    return Number(this.speed.toFixed(1));
  }

  public getMultiplier(): number {
    return Number(this.multiplier.toFixed(1));
  }

  public start(): void {
    this.state = 'PLAYING';
    this.resetGameValues();
  }

  public pause(): void {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    }
  }

  public resume(): void {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  public restart(): void {
    this.start();
  }

  /**
   * Continuous steering from normalized hand coordinate (-1 to 1)
   */
  public setNormalizedHandX(normX: number): void {
    if (this.state !== 'PLAYING') return;

    // Map [-0.8, 0.8] input to 3 lanes (-1, 0, 1) with comfortable deadbands
    let targetLane = 0;
    if (normX < -0.22) {
      targetLane = -1; // Left lane
    } else if (normX > 0.22) {
      targetLane = 1; // Right lane
    } else {
      targetLane = 0; // Center lane
    }

    this.setLane(targetLane);
  }

  public moveLeft(): void {
    if (this.state !== 'PLAYING') return;
    this.setLane(Math.max(-1, this.player.lane - 1));
  }

  public moveRight(): void {
    if (this.state !== 'PLAYING') return;
    this.setLane(Math.min(1, this.player.lane + 1));
  }

  public setLane(lane: number): void {
    const clampedLane = Math.max(-1, Math.min(1, lane));
    this.player.lane = clampedLane;
    this.player.targetX = clampedLane * this.config.laneDistance;
  }

  public jump(): boolean {
    if (this.state !== 'PLAYING') return false;
    if (!this.player.isJumping && this.player.y <= 0.05) {
      this.player.isJumping = true;
      this.player.vy = this.config.jumpVelocity;
      return true;
    }
    return false;
  }

  /**
   * Per-frame simulation tick with delta time (seconds)
   */
  public update(dt: number): {
    collision: boolean;
    collectedOrb: boolean;
  } {
    if (this.state !== 'PLAYING') {
      return { collision: false, collectedOrb: false };
    }

    const safeDt = Math.min(dt, 0.1); // Clamp to prevent tunnel-through on frame hitches

    // 1. Advance distance and accelerate speed progressively
    const distanceDelta = this.speed * safeDt;
    this.distance += distanceDelta;
    this.speed = Math.min(
      this.config.maxSpeed,
      this.config.initialSpeed + (this.distance / 100) * this.config.speedAcceleration
    );

    // Multiplier scales with speed
    this.multiplier = 1.0 + (this.speed - this.config.initialSpeed) / 15.0;
    this.score += distanceDelta * 1.5 * this.multiplier;

    // 2. Player Horizontal Physics (Smooth snappy lerp with banking tilt)
    const lerpFactor = Math.min(1.0, 14.0 * safeDt);
    const prevX = this.player.x;
    this.player.x += (this.player.targetX - this.player.x) * lerpFactor;

    // Bank tilt based on horizontal velocity
    const targetTilt = (this.player.x - prevX) * -1.8;
    this.player.tilt += (targetTilt - this.player.tilt) * Math.min(1.0, 10.0 * safeDt);

    // 3. Player Jump Physics (Gravity & Ground collision)
    if (this.player.isJumping || this.player.y > 0) {
      this.player.y += this.player.vy * safeDt;
      this.player.vy -= this.config.gravity * safeDt;

      if (this.player.y <= 0) {
        this.player.y = 0;
        this.player.vy = 0;
        this.player.isJumping = false;
      }
    }

    // 4. Update Obstacles & Spawning
    this.spawnObstacles();

    let collisionOccurred = false;
    let orbCollected = false;

    // Move obstacles towards player and detect collisions
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= distanceDelta;

      // Check collision when obstacle is in the player contact zone (z between -0.8 and 0.8)
      if (obs.z >= -0.8 && obs.z <= 0.8) {
        const obsX = obs.lane * this.config.laneDistance;
        const dx = Math.abs(this.player.x - obsX);

        if (dx < this.config.playerCollisionRadius + obs.width / 2) {
          if (obs.type === 'ENERGY_ORB' && !obs.collected) {
            obs.collected = true;
            this.score += 250 * this.multiplier;
            orbCollected = true;
          } else if (obs.type === 'BARRIER') {
            // Low barrier: player can jump over if y > barrier height
            if (this.player.y < obs.height * 0.75) {
              collisionOccurred = true;
            }
          } else if (obs.type === 'PYLON') {
            // Tall pylon: cannot jump over, must dodge horizontally
            collisionOccurred = true;
          }
        }
      }

      // Passed obstacle scoring
      if (obs.z < -2.0 && !obs.passed) {
        obs.passed = true;
        if (obs.type !== 'ENERGY_ORB') {
          this.score += 50 * this.multiplier;
        }
      }

      // Despawn obstacles behind player
      if (obs.z < -10.0) {
        this.obstacles.splice(i, 1);
      }
    }

    // Handle collision / Game Over
    if (collisionOccurred) {
      this.handleGameOver();
      return { collision: true, collectedOrb: orbCollected };
    }

    return { collision: false, collectedOrb: orbCollected };
  }

  private spawnObstacles(): void {
    const furthestZ =
      this.obstacles.length > 0
        ? Math.max(...this.obstacles.map((o) => o.z))
        : 0;

    if (furthestZ < this.config.spawnDistance) {
      const spawnZ = Math.max(this.config.spawnDistance, furthestZ + this.config.minObstacleSpacing);

      // Procedural obstacle generator ensuring at least one clear lane
      const patternChoice = Math.random();

      if (patternChoice < 0.45) {
        // Single low barrier (jumpable or dodgeable)
        const lane = Math.floor(Math.random() * 3) - 1;
        this.obstacles.push({
          id: this.nextObstacleId++,
          lane,
          z: spawnZ,
          width: 1.4,
          height: 1.1,
          type: 'BARRIER',
          passed: false,
        });

        // Spawn bonus energy orb in an adjacent lane
        const orbLane = (lane + 1 > 1 ? -1 : lane + 1);
        this.obstacles.push({
          id: this.nextObstacleId++,
          lane: orbLane,
          z: spawnZ + 3.0,
          width: 0.8,
          height: 0.8,
          type: 'ENERGY_ORB',
          passed: false,
        });
      } else if (patternChoice < 0.80) {
        // Two obstacles across 2 lanes, leaving 1 safe lane to dodge
        const safeLane = Math.floor(Math.random() * 3) - 1;
        const obstacleLanes = [-1, 0, 1].filter((l) => l !== safeLane);

        obstacleLanes.forEach((lane) => {
          this.obstacles.push({
            id: this.nextObstacleId++,
            lane,
            z: spawnZ,
            width: 1.3,
            height: 1.0,
            type: Math.random() > 0.4 ? 'BARRIER' : 'PYLON',
            passed: false,
          });
        });
      } else {
        // Tall energy pylon in a single lane
        const lane = Math.floor(Math.random() * 3) - 1;
        this.obstacles.push({
          id: this.nextObstacleId++,
          lane,
          z: spawnZ,
          width: 1.2,
          height: 2.8,
          type: 'PYLON',
          passed: false,
        });
      }
    }
  }

  private handleGameOver(): void {
    this.state = 'GAME_OVER';
    const finalScore = this.getScore();
    if (finalScore > this.highScore) {
      this.highScore = finalScore;
      this.saveHighScore(finalScore);
    }
  }

  private resetGameValues(): void {
    this.speed = this.config.initialSpeed;
    this.distance = 0;
    this.score = 0;
    this.multiplier = 1.0;
    this.obstacles = [];
    this.nextObstacleId = 1;
    this.player = {
      x: 0,
      targetX: 0,
      lane: 0,
      y: 0,
      vy: 0,
      isJumping: false,
      tilt: 0,
    };
  }

  private loadHighScore(): number {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(HIGH_SCORE_KEY);
        return stored ? parseInt(stored, 10) || 0 : 0;
      }
    } catch {
      // LocalStorage access restricted in private/sandbox mode
    }
    return 0;
  }

  private saveHighScore(val: number): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(HIGH_SCORE_KEY, val.toString());
      }
    } catch {
      // Ignore storage errors safely
    }
  }
}
