import React from 'react';
import { Sliders, Camera, CameraOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { CaptureControls } from '../capture/CaptureControls';
import { useGestureEngine } from '../../core/engine/GestureContext';

export interface MobileExperienceBarProps {
  title: string;
  badge?: string;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  onOpenDrawer: () => void;
  extraControls?: React.ReactNode;
}

export const MobileExperienceBar: React.FC<MobileExperienceBarProps> = ({
  title,
  badge,
  canvasContainerRef,
  onOpenDrawer,
  extraControls,
}) => {
  const { isRunning, startEngine, stopEngine, gestureState, cameraStatus } = useGestureEngine();

  const handleToggleCamera = () => {
    if (isRunning) {
      stopEngine();
    } else {
      startEngine();
    }
  };

  const getTrackingLabel = () => {
    if (!isRunning) return 'CAMERA OFF';
    if (cameraStatus === 'requesting') return 'INIT...';
    if (!gestureState.handDetected) return 'SEARCHING';
    if (gestureState.activeGesture && gestureState.activeGesture !== 'NONE') {
      return gestureState.activeGesture;
    }
    return 'TRACKING';
  };

  return (
    <div
      className="mobile-experience-bar hud-interactive"
      style={{
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '8px 12px',
        background: 'rgba(8, 13, 26, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border-glass)',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        gap: '8px',
      }}
    >
      {/* Left: Compact Status & Tracking */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {/* Quick Camera status / toggle */}
        <button
          type="button"
          onClick={handleToggleCamera}
          title={isRunning ? 'Stop Camera' : 'Start Camera'}
          aria-label={isRunning ? 'Stop Camera' : 'Start Camera'}
          style={{
            background: isRunning ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isRunning ? 'rgba(0, 255, 136, 0.35)' : 'var(--border-subtle)'}`,
            borderRadius: '6px',
            padding: '6px',
            color: isRunning ? 'var(--status-live)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '32px',
            minHeight: '32px',
          }}
        >
          {isRunning ? <Camera size={14} color="#00ff88" /> : <CameraOff size={14} />}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: '12px',
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </span>
            {badge && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: 'var(--electric-cyan)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  background: 'rgba(0, 245, 212, 0.1)',
                  border: '1px solid rgba(0, 245, 212, 0.25)',
                }}
              >
                {badge}
              </span>
            )}
          </div>

          {/* Small gesture/tracking indicator */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: gestureState.handDetected
                ? 'var(--electric-cyan)'
                : isRunning
                ? 'var(--text-secondary)'
                : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              className={`led-indicator ${gestureState.handDetected ? 'live' : isRunning ? 'warn' : 'standby'}`}
              style={{ width: '5px', height: '5px' }}
            />
            {getTrackingLabel()}
          </span>
        </div>
      </div>

      {/* Right: Actions (Photo, Record, Extra, More/Settings) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {extraControls}

        {/* Default visible: Photo & Record */}
        <CaptureControls canvasContainerRef={canvasContainerRef} compact />

        {/* Accessible More / Settings button to open advanced drawer */}
        <Button
          variant="glass"
          size="sm"
          icon={<Sliders size={14} />}
          onClick={onOpenDrawer}
          title="More Controls & Settings"
          aria-label="Open advanced controls drawer"
          style={{
            padding: '6px 10px',
            minHeight: '36px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
          }}
        >
          More
        </Button>
      </div>
    </div>
  );
};
