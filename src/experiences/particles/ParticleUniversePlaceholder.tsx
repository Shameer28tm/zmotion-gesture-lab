import React, { useState } from 'react';
import { Sparkles, Heart, Globe, Flower2, Dna, Play, Pause, FastForward } from 'lucide-react';
import { ControlCenter } from '../../components/hud/ControlCenter';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import '../../styles/hud.css';

export type ParticleShape = 'sphere' | 'heart' | 'saturn' | 'flower' | 'dna';

export const ParticleUniversePlaceholder: React.FC = () => {
  const shapes: ParticleShape[] = ['sphere', 'heart', 'saturn', 'flower', 'dna'];
  const [shapeIndex, setShapeIndex] = useState(0);
  const [particleCount, setParticleCount] = useState<number>(15000);
  const [isPaused, setIsPaused] = useState(false);
  const [expansion, setExpansion] = useState(1.0);

  const currentShape = shapes[shapeIndex];

  const handleNextShape = () => {
    setShapeIndex((prev) => (prev + 1) % shapes.length);
  };

  const getShapeIcon = (shape: ParticleShape) => {
    switch (shape) {
      case 'heart':
        return <Heart size={14} />;
      case 'saturn':
        return <Globe size={14} />;
      case 'flower':
        return <Flower2 size={14} />;
      case 'dna':
        return <Dna size={14} />;
      default:
        return <Sparkles size={14} />;
    }
  };

  return (
    <div className="experience-container">
      {/* 3D Viewport Canvas Area */}
      <div className="viewport-canvas-wrapper">
        <div className="scene-placeholder-canvas">
          <div className="scene-placeholder-grid" style={{ width: '640px', height: '640px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                transform: `scale(${expansion})`,
                transition: 'transform 300ms ease-out',
              }}
            >
              <div
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0, 245, 212, 0.4) 0%, rgba(0, 210, 255, 0.1) 60%, transparent 80%)',
                  boxShadow: '0 0 50px rgba(0, 245, 212, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(0, 245, 212, 0.5)',
                }}
              >
                <Sparkles size={40} color="var(--electric-cyan)" />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  color: 'var(--electric-cyan)',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {currentShape} CLOUD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cyberpunk Telemetry HUD Overlay */}
      <div className="hud-overlay">
        {/* Top Telemetry */}
        <div className="hud-top-bar hud-interactive">
          <div className="hud-title-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-cyan)' }}>
                EXPERIMENT B
              </span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                PARTICLE UNIVERSE
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Smooth GPU Vertex Morphing & Parametric Dispersion
            </span>
          </div>

          <div className="hud-telemetry-cluster">
            <div className="telemetry-card">
              <span className="telemetry-label">CONSTRUCT</span>
              <span className="telemetry-value" style={{ color: 'var(--electric-cyan)' }}>
                {currentShape.toUpperCase()}
              </span>
            </div>
            <div className="telemetry-card">
              <span className="telemetry-label">PARTICLE COUNT</span>
              <span className="telemetry-value">{particleCount.toLocaleString()}</span>
            </div>
            <div className="telemetry-card">
              <span className="telemetry-label">EXPANSION</span>
              <span className="telemetry-value">{expansion.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* Bottom Dock */}
        <div className="hud-controls-dock">
          {/* Bottom Left: Shape Presets & Animation Controls */}
          <div className="hud-panel-bottom-left hud-interactive">
            <Card style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  MORPHING CONSTRUCTS (FIST TRIGGER)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--electric-blue)', fontFamily: 'var(--font-mono)' }}>
                  {shapeIndex + 1} / {shapes.length}
                </span>
              </div>

              {/* Shape Pill Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {shapes.map((s, idx) => {
                  const isActive = shapeIndex === idx;
                  return (
                    <button
                      key={s}
                      onClick={() => setShapeIndex(idx)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: isActive ? 'var(--electric-cyan)' : 'var(--border-subtle)',
                        background: isActive ? 'rgba(0, 245, 212, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {getShapeIcon(s)}
                      <span>{s}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: Next Shape, Pause, Particle Density */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<FastForward size={14} />}
                  onClick={handleNextShape}
                  style={{ flex: 1 }}
                >
                  Next Morph
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={isPaused ? <Play size={14} /> : <Pause size={14} />}
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              </div>

              {/* Quality Settings */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  GPU QUALITY TIER
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[5000, 15000, 30000].map((count) => (
                    <button
                      key={count}
                      onClick={() => setParticleCount(count)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: particleCount === count ? 'var(--electric-cyan)' : 'var(--border-subtle)',
                        background: particleCount === count ? 'rgba(0, 245, 212, 0.2)' : 'transparent',
                        color: particleCount === count ? 'var(--electric-cyan)' : 'var(--text-muted)',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                      }}
                    >
                      {count >= 1000 ? `${count / 1000}K` : count}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Right: Shared Control Center */}
          <div className="hud-panel-bottom-right">
            <ControlCenter
              activeExperienceTitle="Particle Universe"
              onResetScene={() => {
                setShapeIndex(0);
                setExpansion(1.0);
                setIsPaused(false);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
