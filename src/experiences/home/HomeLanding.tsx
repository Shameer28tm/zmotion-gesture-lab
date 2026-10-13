import React from 'react';
import { Box, Sparkles, Gamepad2, ArrowRight, ShieldCheck, Cpu, Sliders, HelpCircle } from 'lucide-react';
import type { ExperienceRoute } from '../../types/navigation';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export interface HomeLandingProps {
  onNavigate: (route: ExperienceRoute) => void;
  onOpenOnboarding: () => void;
}

export const HomeLanding: React.FC<HomeLandingProps> = ({ onNavigate, onOpenOnboarding }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', padding: '40px 24px 80px', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
      {/* Hero Section */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px', paddingTop: '40px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Badge label="MEDIAPIPE TASKS VISION" variant="blue" />
          <Badge label="THREE.JS WEBGL ENGINE" variant="live" pulse />
          <Badge label="ZERO CLOUD STREAMING" variant="muted" />
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, maxWidth: '900px' }}>
          Touchless Interaction in <span className="electric-text">Hyperdimensional 3D</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text-secondary)', maxWidth: '680px', lineHeight: 1.6 }}>
          ZMotion — Gesture Lab turns your browser and webcam into a spatial computing controller.
          Manipulate geometry, morph 15,000 particle clouds, and jump through endless cyber obstacles
          using natural hand gestures.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
          <Button variant="primary" size="lg" glow icon={<Sparkles size={18} />} onClick={() => onNavigate('particles')}>
            Launch Particle Universe
          </Button>
          <Button variant="glass" size="lg" icon={<Box size={18} />} onClick={() => onNavigate('studio')}>
            Open 3D Gesture Studio
          </Button>
          <Button variant="outline" size="lg" icon={<Gamepad2 size={18} />} onClick={() => onNavigate('runner')}>
            Play Cyber Runner
          </Button>
          <Button variant="outline" size="lg" icon={<HelpCircle size={18} />} onClick={onOpenOnboarding}>
            Controls Guide
          </Button>
        </div>
      </section>

      {/* 3 Core Experience Showcase Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Experience A: Gesture Studio */}
        <Card cyberCorners style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(0, 210, 255, 0.1)', border: '1px solid rgba(0, 210, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--electric-blue)' }}>
                <Box size={22} />
              </div>
              <Badge label="EXP-A" variant="blue" />
            </div>

            <h3 style={{ fontSize: '22px', color: '#fff' }}>Gesture Studio</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              Manipulate interactive 3D Sphere, Cube, and Torus presets with dual solid and wireframe rendering.
              Use hand centroid rotation, thumb-index pinch distance for scaling, and fingertip proximity for neon color shifts.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              <span className="gesture-pill">Pinch → Scale</span>
              <span className="gesture-pill">Point → Color</span>
              <span className="gesture-pill">Move → Rotate</span>
            </div>
            <Button variant="glass" size="md" icon={<ArrowRight size={15} />} onClick={() => onNavigate('studio')}>
              Explore Studio
            </Button>
          </div>
        </Card>

        {/* Experience B: Particle Universe */}
        <Card cyberCorners style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px', border: '1px solid rgba(0, 210, 255, 0.35)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(0, 245, 212, 0.1)', border: '1px solid rgba(0, 245, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--electric-cyan)' }}>
                <Sparkles size={22} />
              </div>
              <Badge label="EXP-B" variant="live" pulse />
            </div>

            <h3 style={{ fontSize: '22px', color: '#fff' }}>Particle Universe</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              A high-density 15,000-particle construct dynamically morphing between Sphere, Heart, Saturn, Flower, and DNA Helix.
              Features smooth buffer interpolation, fist-triggered shape cycling with cooldown, and pinch expansion.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              <span className="gesture-pill">Fist → Morph</span>
              <span className="gesture-pill">Pinch → Expand</span>
              <span className="gesture-pill">15,000 Pts</span>
            </div>
            <Button variant="primary" size="md" glow icon={<ArrowRight size={15} />} onClick={() => onNavigate('particles')}>
              Explore Particles
            </Button>
          </div>
        </Card>

        {/* Experience C: Gesture Games */}
        <Card cyberCorners style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(255, 170, 0, 0.1)', border: '1px solid rgba(255, 170, 0, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffaa00' }}>
                <Gamepad2 size={22} />
              </div>
              <Badge label="EXP-C" variant="muted" />
            </div>

            <h3 style={{ fontSize: '22px', color: '#fff' }}>Endless Cyber Runner</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              Fast-paced 3D arcade runner on an infinite procedural highway. Dodge incoming cyber hazard cubes using horizontal hand steering
              and make jumping moves by clenching your fist. Includes full keyboard and pause fallbacks.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              <span className="gesture-pill">Hand X → Steer</span>
              <span className="gesture-pill">Fist → Jump</span>
              <span className="gesture-pill">A/D Keys</span>
            </div>
            <Button variant="glass" size="md" icon={<ArrowRight size={15} />} onClick={() => onNavigate('runner')}>
              Play Cyber Runner
            </Button>
          </div>
        </Card>
      </section>

      {/* Engineering Specs & Privacy Banner */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        <Card variant="subtle" style={{ padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <ShieldCheck size={24} color="#00ff88" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '4px' }}>100% Client-Side Privacy</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Webcam frames remain in browser memory. MediaPipe executes via WebAssembly on device.
            </p>
          </div>
        </Card>

        <Card variant="subtle" style={{ padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <Cpu size={24} color="var(--electric-blue)" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '4px' }}>Decoupled 60 FPS Render</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              RAF animation runs independent of camera frame rates, avoiding React state thrashing.
            </p>
          </div>
        </Card>

        <Card variant="subtle" style={{ padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <Sliders size={24} color="var(--electric-cyan)" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '15px', color: '#fff', marginBottom: '4px' }}>Adaptive Filtering</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Low-pass exponential smoothing filters jitter while maintaining responsive gesture detection.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
};
