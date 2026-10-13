import React, { useState } from 'react';
import { Camera, CameraOff, Sliders, RefreshCw, Layers } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Slider } from '../ui/Slider';

export interface ControlCenterProps {
  activeExperienceTitle: string;
  onResetScene?: () => void;
  showOverlayToggle?: boolean;
}

export const ControlCenter: React.FC<ControlCenterProps> = ({
  activeExperienceTitle,
  onResetScene,
  showOverlayToggle = true,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [landmarksVisible, setLandmarksVisible] = useState(true);
  const [sensitivity, setSensitivity] = useState(1.2);
  const [smoothing, setSmoothing] = useState(0.85);
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      cyberCorners
      className="hud-interactive"
      style={{
        padding: '16px',
        width: '100%',
        maxWidth: '380px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
      }}
    >
      {/* Header with Title and Mode */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="led-indicator live" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
            CONTROL CENTER
          </span>
        </div>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)' }}>
          {activeExperienceTitle}
        </span>
      </div>

      {/* Camera Status & Toggle Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {cameraActive ? (
            <Badge label="CAM ON" variant="live" pulse />
          ) : (
            <Badge label="STANDBY" variant="muted" />
          )}
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {cameraActive ? 'Tracking Hand' : 'Keyboard/Mouse Mode'}
          </span>
        </div>

        <Button
          variant={cameraActive ? 'outline' : 'primary'}
          size="sm"
          icon={cameraActive ? <CameraOff size={14} /> : <Camera size={14} />}
          onClick={() => setCameraActive(!cameraActive)}
        >
          {cameraActive ? 'Stop' : 'Start'}
        </Button>
      </div>

      {/* Live Detected Gesture Telemetry */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
        }}
      >
        <div
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>HAND STATUS</span>
          <span style={{ color: cameraActive ? 'var(--status-live)' : 'var(--text-secondary)', fontWeight: 700 }}>
            {cameraActive ? '1 HAND DETECTED' : 'IDLE / MOUSE'}
          </span>
        </div>

        <div
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>ACTIVE GESTURE</span>
          <span style={{ color: 'var(--electric-blue)', fontWeight: 700 }}>
            {cameraActive ? 'OPEN_PALM' : 'CURSOR_ACTIVE'}
          </span>
        </div>
      </div>

      {/* Expanded Tuning Settings */}
      {expanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <Slider
            label="Sensitivity"
            value={sensitivity}
            min={0.5}
            max={2.5}
            step={0.1}
            unit="x"
            onChange={setSensitivity}
          />
          <Slider
            label="Smoothing Filter"
            value={smoothing}
            min={0.5}
            max={0.99}
            step={0.01}
            onChange={setSmoothing}
          />

          {showOverlayToggle && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} /> Show 21 Landmarks
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLandmarksVisible(!landmarksVisible)}
                style={{
                  padding: '4px 8px',
                  color: landmarksVisible ? 'var(--electric-cyan)' : 'var(--text-muted)',
                }}
              >
                {landmarksVisible ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Footer Utility Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '6px',
        }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Sliders size={12} />
          {expanded ? 'Hide Settings' : 'Tune Calibration'}
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onResetScene && (
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={12} />}
              onClick={onResetScene}
              title="Reset 3D Scene Viewport"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
