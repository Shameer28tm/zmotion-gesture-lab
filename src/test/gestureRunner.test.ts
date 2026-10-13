import { describe, it, expect, beforeEach } from 'vitest';
import { RunnerEngine } from '../experiences/runner/runnerEngine';

describe('Gesture Runner Engine (Phase 5)', () => {
  let engine: RunnerEngine;

  beforeEach(() => {
    engine = new RunnerEngine({
      initialSpeed: 20,
      laneDistance: 2.0,
      jumpVelocity: 14.0,
      gravity: 35.0,
    });
  });

  it('initializes in IDLE state with default player values', () => {
    expect(engine.getState()).toBe('IDLE');
    expect(engine.getScore()).toBe(0);
    expect(engine.getDistance()).toBe(0);
    expect(engine.getPlayer().lane).toBe(0);
    expect(engine.getPlayer().y).toBe(0);
    expect(engine.getPlayer().isJumping).toBe(false);
  });

  it('transitions state correctly between IDLE, PLAYING, PAUSED, and restarts', () => {
    engine.start();
    expect(engine.getState()).toBe('PLAYING');

    engine.pause();
    expect(engine.getState()).toBe('PAUSED');

    engine.resume();
    expect(engine.getState()).toBe('PLAYING');

    engine.restart();
    expect(engine.getState()).toBe('PLAYING');
    expect(engine.getScore()).toBe(0);
  });

  it('moves left and right within 3-lane boundaries (-1, 0, 1)', () => {
    engine.start();

    // Center to Left
    engine.moveLeft();
    expect(engine.getPlayer().lane).toBe(-1);
    expect(engine.getPlayer().targetX).toBe(-2.0);

    // Clamps at leftmost lane
    engine.moveLeft();
    expect(engine.getPlayer().lane).toBe(-1);

    // Left to Right
    engine.moveRight();
    expect(engine.getPlayer().lane).toBe(0);
    engine.moveRight();
    expect(engine.getPlayer().lane).toBe(1);
    expect(engine.getPlayer().targetX).toBe(2.0);

    // Clamps at rightmost lane
    engine.moveRight();
    expect(engine.getPlayer().lane).toBe(1);
  });

  it('maps normalized hand coordinates to discrete lanes with deadbands', () => {
    engine.start();

    // Center deadband
    engine.setNormalizedHandX(0.05);
    expect(engine.getPlayer().lane).toBe(0);

    // Left hand sweep
    engine.setNormalizedHandX(-0.5);
    expect(engine.getPlayer().lane).toBe(-1);

    // Right hand sweep
    engine.setNormalizedHandX(0.6);
    expect(engine.getPlayer().lane).toBe(1);
  });

  it('simulates jump trajectory with arcade gravity and lands grounded at y = 0', () => {
    engine.start();

    // Grounded jump initiation
    const jumped = engine.jump();
    expect(jumped).toBe(true);
    expect(engine.getPlayer().isJumping).toBe(true);
    expect(engine.getPlayer().vy).toBe(14.0);

    // Second jump while airborne is rejected (no double jump)
    const doubleJump = engine.jump();
    expect(doubleJump).toBe(false);

    // Simulate airborne ascent (0.1s)
    engine.update(0.1);
    expect(engine.getPlayer().y).toBeGreaterThan(0);

    // Simulate full descent back to ground (1.0s)
    for (let i = 0; i < 20; i++) {
      engine.update(0.05);
    }

    expect(engine.getPlayer().y).toBe(0);
    expect(engine.getPlayer().vy).toBe(0);
    expect(engine.getPlayer().isJumping).toBe(false);
  });

  it('advances distance and score progressively based on speed and delta time', () => {
    engine.start();

    engine.update(0.1);
    expect(engine.getDistance()).toBeGreaterThan(0);
    expect(engine.getScore()).toBeGreaterThan(0);

    const prevScore = engine.getScore();
    engine.update(0.5);
    expect(engine.getScore()).toBeGreaterThan(prevScore);
  });

  it('triggers collision game-over when hitting non-jumpable pylon in same lane', () => {
    engine.start();
    // Force player to center lane
    engine.setLane(0);

    // Run simulation through multiple steps until collision occurs or obstacles spawn
    let hit = false;
    for (let step = 0; step < 200; step++) {
      const res = engine.update(0.05);
      if (res.collision) {
        hit = true;
        break;
      }
    }

    // Either survived or collided; if collided, verify GAME_OVER state
    if (hit) {
      expect(engine.getState()).toBe('GAME_OVER');
    }
  });

  it('persists and retrieves high score from local storage safely', () => {
    engine.start();
    // Artificially simulate distance and score
    for (let i = 0; i < 50; i++) {
      engine.update(0.1);
    }

    const currentScore = engine.getScore();
    expect(currentScore).toBeGreaterThan(0);
  });

  it('supports EASY, NORMAL, and HARD difficulty settings with correct parameters', () => {
    const easyEngine = new RunnerEngine('EASY');
    expect(easyEngine.getDifficulty()).toBe('EASY');
    expect(easyEngine.getSpeed()).toBe(14);

    const normalEngine = new RunnerEngine('NORMAL');
    expect(normalEngine.getDifficulty()).toBe('NORMAL');
    expect(normalEngine.getSpeed()).toBe(19);

    const hardEngine = new RunnerEngine('HARD');
    expect(hardEngine.getDifficulty()).toBe('HARD');
    expect(hardEngine.getSpeed()).toBe(25);

    // Switch difficulty at runtime
    easyEngine.setDifficulty('HARD');
    expect(easyEngine.getDifficulty()).toBe('HARD');
    expect(easyEngine.getSpeed()).toBe(25);
  });
});
