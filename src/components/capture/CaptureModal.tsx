import React from 'react';
import { Download, RotateCcw, X, ShieldCheck, Film, Camera } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MediaCaptureService } from '../../core/capture/MediaCaptureService';

export interface CaptureModalProps {
  isOpen: boolean;
  type: 'photo' | 'video' | null;
  mediaUrl: string | null;
  onClose: () => void;
  onRetake: () => void;
}

export const CaptureModal: React.FC<CaptureModalProps> = ({
  isOpen,
  type,
  mediaUrl,
  onClose,
  onRetake,
}) => {
  if (!isOpen || !mediaUrl || !type) return null;

  const handleDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename =
      type === 'photo'
        ? `zmotion-capture-${timestamp}.png`
        : `zmotion-recording-${timestamp}.webm`;
    MediaCaptureService.getInstance().downloadMedia(mediaUrl, filename);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 7, 13, 0.85)',
        backdropFilter: 'blur(16px)',
        padding: '20px',
      }}
      role="dialog"
      aria-modal="true"
    >
      <Card
        cyberCorners
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(8, 13, 26, 0.95)',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          padding: '20px',
          gap: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {type === 'photo' ? (
              <Camera size={18} color="var(--electric-cyan)" />
            ) : (
              <Film size={18} color="var(--electric-cyan)" />
            )}
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              {type === 'photo' ? 'SNAPSHOT PREVIEW' : 'RECORDING PREVIEW'}
            </h3>
            <Badge label="IN-MEMORY" variant="live" />
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
            aria-label="Close Preview"
          >
            <X size={20} />
          </button>
        </div>

        {/* Media Preview Container */}
        <div
          style={{
            flex: 1,
            minHeight: '260px',
            maxHeight: '440px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {type === 'photo' ? (
            <img
              src={mediaUrl}
              alt="ZMotion Gesture Snapshot"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <video
              src={mediaUrl}
              controls
              autoPlay
              loop
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          )}
        </div>

        {/* Privacy Assurance Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            background: 'rgba(0, 210, 255, 0.04)',
            border: '1px solid rgba(0, 210, 255, 0.2)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <ShieldCheck size={20} color="var(--electric-cyan)" style={{ flexShrink: 0 }} />
          <span>
            <strong style={{ color: '#fff' }}>100% User-Side Privacy:</strong> Your camera stays on
            your device. Photos and videos are processed locally and are never uploaded to our servers.
          </span>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <Button variant="outline" icon={<RotateCcw size={15} />} onClick={onRetake}>
            RETAKE
          </Button>
          <Button variant="primary" glow icon={<Download size={15} />} onClick={handleDownload}>
            DOWNLOAD {type.toUpperCase()}
          </Button>
        </div>
      </Card>
    </div>
  );
};
