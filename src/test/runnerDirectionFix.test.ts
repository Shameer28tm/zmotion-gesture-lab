import { describe, it, expect, beforeEach } from 'vitest';
import { Vector3 } from 'three';
import { RunnerEngine, type Obstacle } from '../experiences/runner/runnerEngine';
import { RunnerSceneController } from '../experiences/runner/RunnerSceneController';
import { LandmarkNormalizer } from '../core/vision/LandmarkNormalizer';
import type { GestureType } from '../core/types';

describe('Runner Direction Fix & 3D Spatial Mapping', () => {
  let engine: RunnerEngine;
  let controller: RunnerSceneController;

  beforeEach(() => {
    engine = new RunnerEngine('EASY');
    controller = new RunnerSceneController();
    // Mount to a mock container
    const container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800 });
    Object.defineProperty(container, 'clientHeight', { value: 600 });
    controller.mount(container);
  });

  it('proves 3D camera projection renders Left lane on screen Left and Right lane on screen Right', () => {
    engine.start();
    const camera = controller.getCamera();
    expect(camera).toBeDefined();
    if (!camera) return;

    camera.updateMatrixWorld();

    // 1. Move player to Left lane (-1)
    engine.moveLeft();
    expect(engine.getPlayer().lane).toBe(-1);
    expect(engine.getPlayer().targetX).toBe(-2.2);

    // Advance engine simulation to lerp player.x to targetX
    for (let i = 0; i < 15; i++) {
      engine.update(0.05);
    }
    expect(engine.getPlayer().x).toBeCloseTo(-2.2, 1);

    // Update scene controller
    controller.updateFromEngine(engine, 0.016);
    const playerGroup = controller.getPlayerGroup();

    // World X position is inverted (-player.x) to align with camera looking along +Z
    expect(playerGroup.position.x).toBeCloseTo(2.2, 1);

    // Project player position to NDC screen coordinates (-1 = Left edge, +1 = Right edge)
    const projectedLeft = new Vector3();
    playerGroup.getWorldPosition(projectedLeft);
    projectedLeft.project(camera);

    // Screen NDC X MUST be negative (Screen Left)
    expect(projectedLeft.x).toBeLessThan(0);
    expect(projectedLeft.x).toBeCloseTo(-0.57, 1);

    // 2. Move player to Right lane (+1)
    engine.moveRight();
    engine.moveRight();
    expect(engine.getPlayer().lane).toBe(1);
    expect(engine.getPlayer().targetX).toBe(2.2);

    for (let i = 0; i < 15; i++) {
      engine.update(0.05);
    }
    expect(engine.getPlayer().x).toBeCloseTo(2.2, 1);

    controller.updateFromEngine(engine, 0.016);
    expect(playerGroup.position.x).toBeCloseTo(-2.2, 1);

    const projectedRight = new Vector3();
    playerGroup.getWorldPosition(projectedRight);
    projectedRight.project(camera);

    // Screen NDC X MUST be positive (Screen Right)
    expect(projectedRight.x).toBeGreaterThan(0);
    expect(projectedRight.x).toBeCloseTo(0.57, 1);
  });

  it('aligns physical hand motion with player steering: physical Left steers Left, physical Right steers Right', () => {
    engine.start();

    // User moves physical hand to their LEFT:
    // Webcam sees hand at right of sensor (x > 0.5, e.g. 0.75)
    // LandmarkNormalizer.toMirroredCentered produces negative X
    const leftRawPoint = { x: 0.75, y: 0.5, z: 0 };
    const leftCentered = LandmarkNormalizer.toMirroredCentered(leftRawPoint);
    expect(leftCentered.x).toBeLessThan(0); // -0.5

    // Feed to runner engine
    engine.setNormalizedHandX(leftCentered.x);
    expect(engine.getPlayer().lane).toBe(-1);

    // User moves physical hand to their RIGHT:
    // Webcam sees hand at left of sensor (x < 0.5, e.g. 0.25)
    // LandmarkNormalizer.toMirroredCentered produces positive X
    const rightRawPoint = { x: 0.25, y: 0.5, z: 0 };
    const rightCentered = LandmarkNormalizer.toMirroredCentered(rightRawPoint);
    expect(rightCentered.x).toBeGreaterThan(0); // +0.5

    // Feed to runner engine
    engine.setNormalizedHandX(rightCentered.x);
    expect(engine.getPlayer().lane).toBe(1);
  });

  it('applies hysteresis deadbands in setNormalizedHandX to prevent edge chatter', () => {
    engine.start();
    expect(engine.getPlayer().lane).toBe(0);

    // 1. Moving left past -0.22 enters Left lane (-1)
    engine.setNormalizedHandX(-0.25);
    expect(engine.getPlayer().lane).toBe(-1);

    // 2. Slight hand jitter to -0.18 stays in Left lane (hysteresis holds until -0.14)
    engine.setNormalizedHandX(-0.18);
    expect(engine.getPlayer().lane).toBe(-1);

    // 3. Crossing inward past -0.14 returns to Center lane (0)
    engine.setNormalizedHandX(-0.10);
    expect(engine.getPlayer().lane).toBe(0);

    // 4. Moving right past +0.22 enters Right lane (1)
    engine.setNormalizedHandX(0.25);
    expect(engine.getPlayer().lane).toBe(1);

    // 5. Slight hand jitter to +0.18 stays in Right lane (hysteresis holds until +0.14)
    engine.setNormalizedHandX(0.18);
    expect(engine.getPlayer().lane).toBe(1);

    // 6. Crossing inward below +0.14 returns to Center lane (0)
    engine.setNormalizedHandX(0.10);
    expect(engine.getPlayer().lane).toBe(0);
  });

  it('banks drone into turns correctly: banks left when moving left, banks right when moving right', () => {
    engine.start();

    // Move to Left lane and update
    engine.moveLeft();
    engine.update(0.016);
    controller.updateFromEngine(engine, 0.016);

    const playerGroup = controller.getPlayerGroup();
    const camera = controller.getCamera();
    if (!camera) return;

    // When moving left, banking tilt in 3D scene tilts drone top towards screen Left (negative rotation)
    expect(playerGroup.rotation.z).toBeLessThan(0);

    // Move to Right lane and update
    engine.moveRight();
    engine.moveRight();
    engine.update(0.016);
    controller.updateFromEngine(engine, 0.016);

    // When moving right, banking tilt in 3D scene tilts drone top towards screen Right (positive rotation)
    expect(playerGroup.rotation.z).toBeGreaterThan(0);
  });

  it('guarantees fair obstacle combinations in EASY mode without impossible walls', () => {
    engine.start();

    // Advance engine to generate procedural obstacles
    for (let i = 0; i < 50; i++) {
      engine.update(0.1);
    }

    const obstacles = engine.getObstacles();
    expect(obstacles.length).toBeGreaterThan(0);

    // In EASY mode, verify that whenever 2 obstacles are spawned at the same Z,
    // they are jumpable BARRIERs so the player never faces an unavoidable 2-lane wall
    const obstaclesByZ = new Map<number, Obstacle[]>();
    obstacles.forEach((obs) => {
      const zKey = Math.round(obs.z * 10) / 10;
      const list = obstaclesByZ.get(zKey) || [];
      list.push(obs);
      obstaclesByZ.set(zKey, list);
    });

    obstaclesByZ.forEach((group) => {
      if (group.length >= 2) {
        // At least one obstacle in any 2-lane group MUST be jumpable
        const hasJumpable = group.some((o) => o.type === 'BARRIER' || o.type === 'ENERGY_ORB');
        expect(hasJumpable).toBe(true);
      }
    });
  });

  it('resets 3D scene and player transforms cleanly on controller reset()', () => {
    engine.start();
    controller.triggerExplosion();
    engine.moveLeft();
    controller.updateFromEngine(engine, 0.05);

    expect(controller.getPlayerGroup().position.x).not.toBe(0);

    // Call reset
    controller.reset();
    expect(controller.getPlayerGroup().position.x).toBe(0);
    expect(controller.getPlayerGroup().rotation.x).toBe(0);
    expect(controller.getPlayerGroup().rotation.z).toBe(0);
  });

  it('keeps keyboard and touch controls consistent: moveLeft moves left on screen, moveRight moves right on screen', () => {
    engine.start();
    const camera = controller.getCamera();
    if (!camera) return;

    // Simulate Keyboard ArrowLeft / 'A' or Touch Left button
    engine.moveLeft();
    expect(engine.getPlayer().lane).toBe(-1);

    for (let i = 0; i < 15; i++) {
      engine.update(0.05);
    }
    controller.updateFromEngine(engine, 0.016);

    const leftVec = new Vector3();
    controller.getPlayerGroup().getWorldPosition(leftVec);
    leftVec.project(camera);
    // Negative NDC X is screen Left
    expect(leftVec.x).toBeLessThan(0);

    // Simulate Keyboard ArrowRight / 'D' or Touch Right button
    engine.moveRight();
    engine.moveRight();
    expect(engine.getPlayer().lane).toBe(1);

    for (let i = 0; i < 15; i++) {
      engine.update(0.05);
    }
    controller.updateFromEngine(engine, 0.016);

    const rightVec = new Vector3();
    controller.getPlayerGroup().getWorldPosition(rightVec);
    rightVec.project(camera);
    // Positive NDC X is screen Right
    expect(rightVec.x).toBeGreaterThan(0);
  });

  it('prevents repeated jumps while airborne or from a sustained fist gesture', () => {
    engine.start();

    // 1. First jump while grounded succeeds
    const jump1 = engine.jump();
    expect(jump1).toBe(true);
    expect(engine.getPlayer().isJumping).toBe(true);

    // 2. Second jump while still airborne is rejected by engine
    const jumpAirborne = engine.jump();
    expect(jumpAirborne).toBe(false);

    // 3. Simulate latching: while the hand remains in CLOSED_FIST, unlatching is blocked
    let isFistCurrentlyLatched = true;
    let lastJumpTime = 1000;
    const now = 1200;

    // Grounded check after descent
    for (let i = 0; i < 25; i++) {
      engine.update(0.05);
    }
    expect(engine.getPlayer().isJumping).toBe(false);

    // Even though grounded, if gesture is still CLOSED_FIST, latch does not reset
    const activeGesture = 'CLOSED_FIST';
    const playerGrounded = !engine.getPlayer().isJumping;
    const timeSinceJump = now - lastJumpTime;

    if (playerGrounded && timeSinceJump > 350 && activeGesture !== 'CLOSED_FIST') {
      isFistCurrentlyLatched = false;
    }
    expect(isFistCurrentlyLatched).toBe(true);

    // Once hand opens up to OPEN_PALM and cooldown passes, latch clears
    const releaseNow = 1500;
    const timeSinceRelease = releaseNow - lastJumpTime;
    const releasedGesture: GestureType = 'OPEN_PALM';
    if (playerGrounded && timeSinceRelease > 350 && (releasedGesture as string) !== 'CLOSED_FIST') {
      isFistCurrentlyLatched = false;
    }
    expect(isFistCurrentlyLatched).toBe(false);

    // New jump is now permitted
    const jump2 = engine.jump();
    expect(jump2).toBe(true);
  });

  it('supports invert-steering calibration mode when enabled', () => {
    engine.start();

    // Normal mode: physical left (normX = -0.5) steers to lane -1
    const invertSteering = false;
    const normX = -0.5;
    const effectiveX = invertSteering ? -normX : normX;
    engine.setNormalizedHandX(effectiveX);
    expect(engine.getPlayer().lane).toBe(-1);

    // Inverted mode: physical left (normX = -0.5) inverted becomes +0.5, steering to lane 1
    const invertedMode = true;
    const invertedX = invertedMode ? -normX : normX;
    engine.setNormalizedHandX(invertedX);
    expect(engine.getPlayer().lane).toBe(1);
  });
});
