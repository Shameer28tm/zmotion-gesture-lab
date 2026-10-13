import React from 'react';
import { Cpu, ShieldCheck, GitBranch } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const AboutExperience: React.FC = () => {
  return (
    <div
      style={{
        padding: '40px 24px 80px',
        maxWidth: '1080px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge label="SYSTEM ARCHITECTURE" variant="blue" />
          <Badge label="SPECIFICATION V1.0" variant="muted" />
        </div>
        <h1 style={{ fontSize: '36px', color: '#fff' }}>Architecture & Technical Reference</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, maxWidth: '800px' }}>
          ZMotion — Gesture Lab is an integrated browser platform uniting computer-vision landmark tracking
          with high-performance WebGL 3D rendering. The pipeline processes video feeds entirely on the client
          using WebAssembly, ensuring maximum responsiveness and zero privacy leaks.
        </p>
      </div>

      {/* Pipeline Diagram Grid */}
      <Card cyberCorners style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={20} color="var(--electric-blue)" /> Modular Gesture Engine Pipeline
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)' }}>STEP 01</span>
            <h4 style={{ fontSize: '14px', color: '#fff', margin: '4px 0' }}>CameraManager</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Handles getUserMedia requests, track teardown, visibility changes, and video stream lifecycle.
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(0, 245, 212, 0.05)', border: '1px solid rgba(0, 245, 212, 0.2)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--electric-cyan)' }}>STEP 02</span>
            <h4 style={{ fontSize: '14px', color: '#fff', margin: '4px 0' }}>HandLandmarker</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Executes MediaPipe Tasks Vision WebAssembly model, yielding 21 3D hand landmarks per frame.
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ffaa00' }}>STEP 03</span>
            <h4 style={{ fontSize: '14px', color: '#fff', margin: '4px 0' }}>LandmarkNormalizer</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Normalizes coordinates relative to palm scale and flips horizontal axis for mirror preview.
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255, 51, 102, 0.05)', border: '1px solid rgba(255, 51, 102, 0.2)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ff3366' }}>STEP 04</span>
            <h4 style={{ fontSize: '14px', color: '#fff', margin: '4px 0' }}>GestureClassifier</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Computes geometric ratios for pinch, fist, open palm, and pointing states with confidence metrics.
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(192, 132, 252, 0.05)', border: '1px solid rgba(192, 132, 252, 0.2)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#c084fc' }}>STEP 05</span>
            <h4 style={{ fontSize: '14px', color: '#fff', margin: '4px 0' }}>GestureSmoother</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Applies exponential low-pass filter and event cooldown timers to suppress camera jitter.
            </p>
          </div>
        </div>
      </Card>

      {/* Reference Attribution & Clean-Room Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <Card style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--electric-blue)' }}>
            <GitBranch size={16} />
            <strong style={{ fontSize: '14px' }}>Reference Attribution</strong>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Inspired by open-source interaction experiments by <em>harshooit</em> (Particle tracking),
            <em>Jayanth0124</em> (3D gesture control), and <em>ronmacc</em> (Three.js cube runner).
            All algorithms, components, shaders, and architectures in ZMotion have been rewritten from
            scratch in clean-room TypeScript to ensure strict licensing compliance and production quality.
          </p>
        </Card>

        <Card style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00ff88' }}>
            <ShieldCheck size={16} />
            <strong style={{ fontSize: '14px' }}>Privacy & Hardware Constraints</strong>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Requires standard WebGL 2.0 and WebAssembly support. Compatible with all modern desktop and
            mobile browsers (Chrome, Edge, Firefox, Safari). Designed with adaptive GPU fallbacks
            (5,000 to 30,000 particle scaling) to maintain stable 60 FPS across varying device capabilities.
          </p>
        </Card>
      </div>
    </div>
  );
};
