/**
 * Deterministic 3D target shape generators and math for Particle Universe
 */

export type ParticlePresetShape = 'sphere' | 'heart' | 'saturn' | 'flower' | 'dna';

export const PARTICLE_PRESETS: ParticlePresetShape[] = [
  'sphere',
  'heart',
  'saturn',
  'flower',
  'dna',
];

export interface ParticleConfig {
  defaultCount: number;
  minScale: number;
  maxScale: number;
  baseExpansion: number;
  morphDurationMs: number;
}

export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  defaultCount: 15000,
  minScale: 0.5,
  maxScale: 2.5,
  baseExpansion: 1.0,
  morphDurationMs: 1200,
};

/** Pseudo-random deterministic noise generator based on index */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Cubic easing function for smooth shape morph transitions */
export function easeCubicInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * 1. Sphere Generator (Fibonacci distribution with core-to-shell volume)
 */
export function generateSphere(count: number, radius: number = 2.4): Float32Array {
  const positions = new Float32Array(count * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.39996 rad

  for (let i = 0; i < count; i++) {
    const yNorm = 1 - (i / (count - 1)) * 2; // 1 down to -1
    const rRing = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
    const theta = goldenAngle * i;

    // 85% surface shell, 15% inner volume depth
    const isInner = pseudoRandom(i) < 0.15;
    const depthFactor = isInner ? 0.3 + 0.7 * Math.cbrt(pseudoRandom(i + 1)) : 0.96 + 0.08 * pseudoRandom(i + 2);
    const r = radius * depthFactor;

    positions[i * 3] = Math.cos(theta) * rRing * r;
    positions[i * 3 + 1] = yNorm * r;
    positions[i * 3 + 2] = Math.sin(theta) * rRing * r;
  }

  return positions;
}

/**
 * 2. 3D Parametric Heart Generator
 */
export function generateHeart(count: number, scale: number = 0.16): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const u = (i / count) * Math.PI * 2 - Math.PI; // -PI to PI
    const randZ = (pseudoRandom(i) - 0.5) * 2;
    const randR = 0.85 + 0.3 * pseudoRandom(i * 3);

    // Parametric cardioid curves
    const sinU = Math.sin(u);
    const cosU = Math.cos(u);
    const hx = 16 * Math.pow(sinU, 3);
    const hy = 13 * cosU - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);

    // 3D thickness tapers towards tips
    const thickness = (1.0 - Math.abs(u) / Math.PI * 0.4) * 8.0;
    const hz = randZ * thickness * Math.abs(cosU);

    positions[i * 3] = hx * scale * randR;
    positions[i * 3 + 1] = hy * scale * randR + 0.3; // subtle center shift
    positions[i * 3 + 2] = hz * scale;
  }

  return positions;
}

/**
 * 3. Saturn with Rings Generator
 */
export function generateSaturn(
  count: number,
  globeRadius: number = 1.35,
  ringInner: number = 1.9,
  ringOuter: number = 3.65
): Float32Array {
  const positions = new Float32Array(count * 3);
  const globeCount = Math.floor(count * 0.38);
  const ringCount = count - globeCount;

  // Tilt Saturn's axis by ~24 degrees
  const tiltRad = (24 * Math.PI) / 180;
  const cosTilt = Math.cos(tiltRad);
  const sinTilt = Math.sin(tiltRad);

  // A. Central Planet Sphere
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < globeCount; i++) {
    const yNorm = 1 - (i / (globeCount - 1)) * 2;
    const rRing = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
    const theta = goldenAngle * i;
    const r = globeRadius * (0.95 + 0.08 * pseudoRandom(i));

    const x0 = Math.cos(theta) * rRing * r;
    const y0 = yNorm * r;
    const z0 = Math.sin(theta) * rRing * r;

    // Apply axial tilt
    positions[i * 3] = x0 * cosTilt - y0 * sinTilt;
    positions[i * 3 + 1] = x0 * sinTilt + y0 * cosTilt;
    positions[i * 3 + 2] = z0;
  }

  // B. Flat Particle Rings
  for (let j = 0; j < ringCount; j++) {
    const idx = globeCount + j;
    const frac = j / ringCount;
    const theta = frac * Math.PI * 2 * 11 + pseudoRandom(j) * 0.1;
    // Ring density: denser towards middle ring
    const radiusFrac = pseudoRandom(j * 5);
    const ringR = ringInner + radiusFrac * (ringOuter - ringInner);
    const ringY = (pseudoRandom(j * 7) - 0.5) * 0.08;

    const x0 = Math.cos(theta) * ringR;
    const y0 = ringY;
    const z0 = Math.sin(theta) * ringR;

    // Apply axial tilt to ring disc
    positions[idx * 3] = x0 * cosTilt - y0 * sinTilt;
    positions[idx * 3 + 1] = x0 * sinTilt + y0 * cosTilt;
    positions[idx * 3 + 2] = z0;
  }

  return positions;
}

/**
 * 4. Cyber Floral Lotus Generator (Rose curve with 3D petal curvature)
 */
export function generateFlower(count: number, petals: number = 6, scale: number = 2.6): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2 * 7 + pseudoRandom(i) * 0.05;
    const radiusNorm = 0.2 + 0.8 * Math.sqrt(pseudoRandom(i * 2));
    
    // Rose petal modulation
    const petalCurve = 0.4 + 0.6 * Math.abs(Math.cos((petals * theta) / 2));
    const r = scale * radiusNorm * petalCurve;

    // Petal elevation curls upward towards tips
    const y = Math.pow(radiusNorm, 1.8) * 0.9 * Math.sin(petals * theta) - 0.2;

    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(theta) * r;
  }

  return positions;
}

/**
 * 5. DNA Double Helix Generator (Intertwined helices with base-pair rungs)
 */
export function generateDNA(
  count: number,
  length: number = 5.2,
  radius: number = 1.25,
  turns: number = 2.8
): Float32Array {
  const positions = new Float32Array(count * 3);
  const strandCount = Math.floor(count * 0.72);
  const rungCount = count - strandCount;

  // A. Double Helical Strands
  const halfStrand = Math.floor(strandCount / 2);
  for (let i = 0; i < strandCount; i++) {
    const isStrand2 = i >= halfStrand;
    const strandIndex = isStrand2 ? i - halfStrand : i;
    const t = strandIndex / halfStrand - 0.5; // -0.5 to 0.5
    const y = t * length;
    const theta = t * turns * Math.PI * 2 + (isStrand2 ? Math.PI : 0);

    const jitterR = radius * (0.95 + 0.1 * pseudoRandom(i));
    const jitterY = y + (pseudoRandom(i * 2) - 0.5) * 0.08;

    positions[i * 3] = Math.cos(theta) * jitterR;
    positions[i * 3 + 1] = jitterY;
    positions[i * 3 + 2] = Math.sin(theta) * jitterR;
  }

  // B. Base Pair Connecting Rungs
  for (let j = 0; j < rungCount; j++) {
    const idx = strandCount + j;
    // Discretize rungs along the height
    const rungStep = Math.floor((j / rungCount) * (turns * 8));
    const totalSteps = turns * 8;
    const t = (rungStep / totalSteps) - 0.5;
    const y = t * length;
    const theta = t * turns * Math.PI * 2;

    // Linear interpolation between Strand 1 and Strand 2
    const rungFrac = (j % 25) / 25; // 0 to 1
    const p1X = Math.cos(theta) * radius;
    const p1Z = Math.sin(theta) * radius;
    const p2X = Math.cos(theta + Math.PI) * radius;
    const p2Z = Math.sin(theta + Math.PI) * radius;

    positions[idx * 3] = p1X + (p2X - p1X) * rungFrac;
    positions[idx * 3 + 1] = y + (pseudoRandom(idx) - 0.5) * 0.04;
    positions[idx * 3 + 2] = p1Z + (p2Z - p1Z) * rungFrac;
  }

  return positions;
}

/**
 * Returns color gradient vertex buffer [R, G, B, R, G, B, ...] for each preset
 */
export function generatePresetColors(count: number, preset: ParticlePresetShape): Float32Array {
  const colors = new Float32Array(count * 3);

  // Palette definitions in RGB 0..1
  const palettes: Record<ParticlePresetShape, [number, number, number][]> = {
    sphere: [
      [0.0, 0.82, 1.0], // Electric Cyan
      [0.0, 0.96, 0.83], // Mint
      [0.2, 0.45, 1.0], // Deep Blue
    ],
    heart: [
      [1.0, 0.0, 0.66], // Hot Magenta
      [1.0, 0.25, 0.5], // Coral
      [0.75, 0.52, 0.99], // Lavender
    ],
    saturn: [
      [1.0, 0.67, 0.0], // Solar Amber
      [0.0, 0.96, 0.83], // Mint
      [1.0, 0.85, 0.3], // Pale Gold
    ],
    flower: [
      [0.75, 0.52, 0.99], // Cyber Lavender
      [1.0, 0.0, 0.66], // Hot Magenta
      [0.0, 0.82, 1.0], // Electric Cyan
    ],
    dna: [
      [0.0, 0.82, 1.0], // Electric Cyan
      [0.75, 0.52, 0.99], // Cyber Lavender
      [0.0, 1.0, 0.53], // Neon Green
    ],
  };

  const currentPalette = palettes[preset] || palettes.sphere;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const colorIndex = (t * (currentPalette.length - 1)) % (currentPalette.length - 1);
    const idx0 = Math.floor(colorIndex);
    const idx1 = Math.min(currentPalette.length - 1, idx0 + 1);
    const mix = colorIndex - idx0;

    const c0 = currentPalette[idx0];
    const c1 = currentPalette[idx1];

    colors[i * 3] = c0[0] + (c1[0] - c0[0]) * mix;
    colors[i * 3 + 1] = c0[1] + (c1[1] - c0[1]) * mix;
    colors[i * 3 + 2] = c0[2] + (c1[2] - c0[2]) * mix;
  }

  return colors;
}

/**
 * Returns preset position buffer based on shape name
 */
export function generatePresetPositions(count: number, preset: ParticlePresetShape): Float32Array {
  switch (preset) {
    case 'heart':
      return generateHeart(count);
    case 'saturn':
      return generateSaturn(count);
    case 'flower':
      return generateFlower(count);
    case 'dna':
      return generateDNA(count);
    case 'sphere':
    default:
      return generateSphere(count);
  }
}
