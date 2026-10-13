import React, { useState } from 'react';
import { Box, Circle, Disc, ZoomIn, ZoomOut } from 'lucide-react';
import { ControlCenter } from '../../components/hud/ControlCenter';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import '../../styles/hud.css';

export type StudioShape = 'sphere' | 'cube' | 'torus';

export const GestureStudioPlaceholder: React.FC = () => {
  const [selectedShape, setSelectedShape] = useState<StudioShape>('sphere');
  const [scale, setScale] = useState(1.0);
  const [currentColor, setCurrentColor] = useState('#00d2ff');
  const [wireframeOnly, setWireframeOnly] = useState(false);

  const colors = ['#00d2ff', '#00f5d4', '#ff00aa', '#ffaa00', '#c084fc', '#ffffff'];

  return (
    <div className="experience-container">
      {/* 3D Viewport Area */}
      <div className="viewport-canvas-wrapper">
        <div className="scene-placeholder-canvas">
          <div className="scene-placeholder-grid">
            <div
              style={{
                width: '180px',
                height: '180px',
                borderRadius: selectedShape === 'sphere' ? '50%' : selectedShape === 'torus' ? '40%' : '16px',
                border: `2px dashed ${currentColor}`,
                boxShadow: `0 0 32px ${currentColor}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${scale})`,
                transition: 'all 200ms ease-out',
                background: wireframeOnly ? 'transparent' : `${currentColor}15`,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: currentColor,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {selectedShape} (3D)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Professional HUD Shell */}
      <div className="hud-overlay">
        {/* Top Telemetry Bar */}
        <div className="hud-top-bar hud-interactive">
          <div className="hud-title-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--electric-blue)' }}>
                EXPERIMENT A
              </span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                GESTURE STUDIO
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Interactive Solid & Wireframe Spatial Mesh Preset
            </span>
          </div>

          <div className="hud-telemetry-cluster">
            <div className="telemetry-card">
              <span className="telemetry-label">CONSTRUCT</span>
              <span className="telemetry-value" style={{ color: 'var(--electric-blue)' }}>
                {selectedShape.toUpperCase()}
              </span>
            </div>
            <div className="telemetry-card">
              <span className="telemetry-label">SCALE FACTOR</span>
              <span className="telemetry-value">{scale.toFixed(2)}x</span>
            </div>
            <div className="telemetry-card">
              <span className="telemetry-label">COLOR HEX</span>
              <span className="telemetry-value" style={{ color: currentColor }}>
                {currentColor}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom HUD Controls Dock */}
        <div className="hud-controls-dock">
          {/* Bottom Left: Presets & Fallback Tooling */}
          <div className="hud-panel-bottom-left hud-interactive">
            <Card style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  SHAPE PRESETS
                </span>
                <span style={{ fontSize: '11px', color: 'var(--electric-cyan)', fontFamily: 'var(--font-mono)' }}>
                  Phase 1 Preview
                </span>
              </div>

              {/* Shape Selection Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <Button
                  variant={selectedShape === 'sphere' ? 'primary' : 'glass'}
                  size="sm"
                  icon={<Circle size={14} />}
                  onClick={() => setSelectedShape('sphere')}
                >
                  Sphere
                </Button>
                <Button
                  variant={selectedShape === 'cube' ? 'primary' : 'glass'}
                  size="sm"
                  icon={<Box size={14} />}
                  onClick={() => setSelectedShape('cube')}
                >
                  Cube
                </Button>
                <Button
                  variant={selectedShape === 'torus' ? 'primary' : 'glass'}
                  size="sm"
                  icon={<Disc size={14} />}
                  onClick={() => setSelectedShape('torus')}
                >
                  Torus
                </Button>
              </div>

              {/* Color Presets */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  NEON PALETTE
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrentColor(c)}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: currentColor === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Manual Scale Controls Fallback */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ZoomOut size={13} />}
                  onClick={() => setScale((s) => Math.max(0.4, Number((s - 0.2).toFixed(1))))}
                  style={{ flex: 1 }}
                >
                  Scale -
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ZoomIn size={13} />}
                  onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.2).toFixed(1))))}
                  style={{ flex: 1 }}
                >
                  Scale +
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWireframeOnly(!wireframeOnly)}
                  style={{ flex: 1 }}
                >
                  {wireframeOnly ? 'Solid' : 'Wireframe'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Bottom Right: Shared Control Center */}
          <div className="hud-panel-bottom-right">
            <ControlCenter
              activeExperienceTitle="Gesture Studio"
              onResetScene={() => {
                setScale(1.0);
                setSelectedShape('sphere');
                setCurrentColor('#00d2ff');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
