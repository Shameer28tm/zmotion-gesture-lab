import React from 'react';
import { Camera, Move, Disc, Hand, Keyboard, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ZMotion Gesture Lab — Controls & Calibration"
      subtitle="Complete Guide to Hand Tracking, Presets, and Fallbacks"
      footerActions={
        <Button variant="primary" onClick={onClose}>
          Enter Gesture Lab
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Privacy Callout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(0, 255, 136, 0.08)',
            border: '1px solid rgba(0, 255, 136, 0.25)',
            color: '#00ff88',
            fontSize: '13px',
          }}
        >
          <ShieldCheck size={20} style={{ flexShrink: 0 }} />
          <span>
            <strong>Local Edge Privacy:</strong> All computer-vision landmark processing occurs
            locally inside your browser via WebAssembly. Your webcam feed is never recorded, uploaded,
            or transmitted to any server.
          </span>
        </div>

        {/* Gestures Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--electric-blue)', marginBottom: '8px' }}>
              <Move size={18} />
              <strong style={{ fontSize: '14px' }}>Hand Position</strong>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Move hand across screen to rotate 3D meshes, swivel particle constructs, or steer the runner player left and right.
            </p>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--electric-cyan)', marginBottom: '8px' }}>
              <Disc size={18} />
              <strong style={{ fontSize: '14px' }}>Thumb-Index Pinch</strong>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Pinch thumb and index fingertip together to shrink or expand 3D objects, or pulse particle intensity.
            </p>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffaa00', marginBottom: '8px' }}>
              <Hand size={18} />
              <strong style={{ fontSize: '14px' }}>Closed Fist</strong>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Close all fingers into a firm fist to cycle particle presets (Sphere → Heart → Saturn → Flower → DNA) or trigger a runner jump.
            </p>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', marginBottom: '8px' }}>
              <Keyboard size={18} />
              <strong style={{ fontSize: '14px' }}>Keyboard & Mouse</strong>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Full fallback without webcam: Drag mouse to rotate, scroll/slider to scale, <kbd>A</kbd>/<kbd>D</kbd> to steer, and <kbd>Space</kbd> to jump.
            </p>
          </div>
        </div>

        {/* Tips */}
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={14} color="var(--electric-blue)" />
          <span>For best performance, ensure good room lighting and position your hand 1.5–3 feet from the webcam.</span>
        </div>
      </div>
    </Modal>
  );
};
