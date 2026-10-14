import React, { useState } from 'react';
import {
  Camera,
  CameraOff,
  Sliders,
  RefreshCw,
  Layers,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Slider } from '../ui/Slider';
import { useGestureEngine } from '../../core/engine/GestureContext';

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
  const {
    cameraStatus,
    gestureState,
    diagnostics,
    errorMessage,
    isRunning,
    startEngine,
    stopEngine,
    setSensitivity,
    setSmoothing,
    showSkeleton,
    setShowSkeleton,
    engine,
  } = useGestureEngine();

  const [expanded, setExpanded] = useState(false);
  const config = engine.getConfig();

  const handleToggleCamera = () => {
    if (isRunning) {
      stopEngine();
    } else {
      startEngine();
    }
  };

  const getStatusBadge = () => {
    switch (cameraStatus) {
      case 'streaming':
        return <Badge label="STREAMING" variant="live" pulse />;
      case 'requesting':
        return <Badge label="INITIALIZING" variant="warn" pulse />;
      case 'permission_denied':
        return <Badge label="PERM DENIED" variant="err" />;
      case 'not_found':
        return <Badge label="NO CAMERA" variant="err" />;
      case 'error':
        return <Badge label="ERROR" variant="err" />;
      case 'stopped':
      case 'idle':
      default:
        return <Badge label="STANDBY" variant="muted" />;
    }
  };

  const getGestureColor = () => {
    switch (gestureState.activeGesture) {
      case 'PINCH':
        return 'var(--electric-cyan)';
      case 'CLOSED_FIST':
        return '#ffaa00';
      case 'OPEN_PALM':
        return 'var(--status-live)';
      case 'POINTING':
        return '#c084fc';
      default:
        return 'var(--text-secondary)';
    }
  };

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
          <div className={`led-indicator ${isRunning ? 'live' : 'warn'}`} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
            CONTROL CENTER
          </span>
        </div>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--electric-blue)' }}>
          {activeExperienceTitle}
        </span>
      </div>

      {/* Error Callout if permission denied or camera failed */}
      {errorMessage && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'rgba(255, 51, 102, 0.1)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#ff3366',
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

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
          {getStatusBadge()}
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {isRunning ? 'Hand Tracking Active' : 'Keyboard/Mouse Fallback'}
          </span>
        </div>

        <Button
          variant={isRunning ? 'outline' : 'primary'}
          size="sm"
          glow={!isRunning}
          icon={isRunning ? <CameraOff size={14} /> : <Camera size={14} />}
          onClick={handleToggleCamera}
          disabled={cameraStatus === 'requesting'}
        >
          {isRunning ? 'Stop' : cameraStatus === 'requesting' ? 'Starting...' : 'Enable Cam'}
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
          <span style={{ color: 'var(--text-muted)' }}>HAND PRESENCE</span>
          <span
            style={{
              color: gestureState.handDetected ? 'var(--status-live)' : 'var(--text-muted)',
              fontWeight: 700,
            }}
          >
            {gestureState.handDetected
              ? `TRACKING (${gestureState.handedness})`
              : isRunning
              ? 'SEARCHING...'
              : 'OFFLINE / MOUSE'}
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
          <span style={{ color: 'var(--text-muted)' }}>DETECTED GESTURE</span>
          <span style={{ color: getGestureColor(), fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {gestureState.activeGesture !== 'NONE' && <Sparkles size={11} />}
            {gestureState.handDetected && gestureState.activeGesture === 'NONE'
              ? 'NEUTRAL'
              : gestureState.activeGesture}
          </span>
        </div>
      </div>

      {/* Live Engine Diagnostics (FPS, Latency, Accel) */}
      {isRunning && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            borderRadius: '6px',
            background: 'rgba(0, 210, 255, 0.04)',
            border: '1px solid rgba(0, 210, 255, 0.15)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>LATENCY:</span>
            <span style={{ color: 'var(--electric-cyan)', fontWeight: 700 }}>
              {diagnostics.inferenceDurationMs}ms
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>VISION FPS:</span>
            <span style={{ color: '#fff', fontWeight: 700 }}>
              ~{diagnostics.inferenceFps}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>ACCEL:</span>
            <span style={{ color: diagnostics.delegate === 'GPU' ? '#00ff88' : '#ffaa00', fontWeight: 700 }}>
              {diagnostics.delegate}
            </span>
          </div>
        </div>
      )}

      {/* Real-time Pinch Diagnostics Gauge */}
      {gestureState.handDetected && gestureState.metrics.pinchStrength > 0.05 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '6px 10px',
            borderRadius: '6px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>PINCH ENGAGEMENT</span>
            <span
              style={{
                color:
                  gestureState.metrics.pinchStrength > 0.65
                    ? 'var(--electric-cyan)'
                    : 'var(--text-secondary)',
                fontWeight: 700,
              }}
            >
              {Math.round(gestureState.metrics.pinchStrength * 100)}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.round(gestureState.metrics.pinchStrength * 100)}%`,
                height: '100%',
                backgroundColor:
                  gestureState.metrics.pinchStrength > 0.65
                    ? 'var(--electric-cyan)'
                    : 'var(--electric-blue)',
                boxShadow:
                  gestureState.metrics.pinchStrength > 0.65
                    ? '0 0 8px var(--electric-cyan)'
                    : 'none',
                transition: 'width 80ms ease-out',
              }}
            />
          </div>
        </div>
      )}

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
            value={config.sensitivity}
            min={0.5}
            max={2.5}
            step={0.1}
            unit="x"
            onChange={setSensitivity}
          />
          <Slider
            label="Smoothing Filter"
            value={config.smoothingAlpha}
            min={0.3}
            max={0.95}
            step={0.05}
            onChange={setSmoothing}
          />

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
              <Sparkles size={14} color="var(--electric-cyan)" /> Fast Motion Anti-Lag
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => engine.setConfig({ adaptiveSmoothing: !config.adaptiveSmoothing })}
              style={{
                padding: '4px 8px',
                color: config.adaptiveSmoothing ? 'var(--electric-cyan)' : 'var(--text-muted)',
              }}
            >
              {config.adaptiveSmoothing ? 'Active' : 'Disabled'}
            </Button>
          </div>

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
                <Layers size={14} /> Show Hand Skeleton
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSkeleton(!showSkeleton)}
                style={{
                  padding: '4px 8px',
                  color: showSkeleton ? 'var(--electric-cyan)' : 'var(--text-muted)',
                }}
              >
                {showSkeleton ? 'Enabled' : 'Disabled'}
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
