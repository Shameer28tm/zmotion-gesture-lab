import React, { useState, useCallback, useEffect } from 'react';
import { Camera, Video, Square, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { MediaCaptureService } from '../../core/capture/MediaCaptureService';
import { CaptureModal } from './CaptureModal';
import { useGestureEngine } from '../../core/engine/GestureContext';

export interface CaptureControlsProps {
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  compact?: boolean;
}

export const CaptureControls: React.FC<CaptureControlsProps> = ({
  canvasContainerRef,
  className = '',
  compact = false,
}) => {
  const { engine } = useGestureEngine();
  const captureService = MediaCaptureService.getInstance();

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'photo' | 'video' | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewMediaUrl) {
        captureService.revokeMedia(previewMediaUrl);
      }
    };
  }, [previewMediaUrl, captureService]);

  const getCanvasElement = (): HTMLCanvasElement | null => {
    if (!canvasContainerRef.current) return null;
    return canvasContainerRef.current.querySelector('canvas');
  };

  const handleCapturePhoto = useCallback(async () => {
    try {
      setIsCapturingPhoto(true);
      const video = engine.getVideoElement();
      const canvas = getCanvasElement();
      const url = await captureService.capturePhoto(video, canvas);

      if (previewMediaUrl) {
        captureService.revokeMedia(previewMediaUrl);
      }
      setPreviewMediaUrl(url);
      setPreviewType('photo');
    } catch (err) {
      console.error('Photo capture error:', err);
    } finally {
      setIsCapturingPhoto(false);
    }
  }, [engine, captureService, previewMediaUrl]);

  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      try {
        const url = await captureService.stopVideoRecording();
        setIsRecording(false);
        setRecordSeconds(0);
        if (previewMediaUrl) {
          captureService.revokeMedia(previewMediaUrl);
        }
        setPreviewMediaUrl(url);
        setPreviewType('video');
      } catch (err) {
        console.error('Stop recording error:', err);
        setIsRecording(false);
        setRecordSeconds(0);
      }
    } else {
      try {
        const video = engine.getVideoElement();
        const canvas = getCanvasElement();
        const started = captureService.startVideoRecording(video, canvas, (sec) => {
          setRecordSeconds(sec);
        });
        if (started) {
          setIsRecording(true);
        }
      } catch (err) {
        console.error('Start recording error:', err);
      }
    }
  }, [isRecording, engine, captureService, previewMediaUrl]);

  const handleCloseModal = useCallback(() => {
    if (previewMediaUrl) {
      captureService.revokeMedia(previewMediaUrl);
      setPreviewMediaUrl(null);
      setPreviewType(null);
    }
  }, [previewMediaUrl, captureService]);

  const handleRetake = useCallback(() => {
    handleCloseModal();
  }, [handleCloseModal]);

  return (
    <>
      <div
        className={`capture-controls-cluster ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? '6px' : '8px',
        }}
      >
        <Button
          variant="glass"
          size="sm"
          icon={isCapturingPhoto ? <Loader2 size={13} className="spin" /> : <Camera size={13} />}
          onClick={handleCapturePhoto}
          disabled={isCapturingPhoto || isRecording}
          title="Capture Snapshot (100% Client-Side Privacy)"
          aria-label="Capture photo snapshot"
          style={compact ? { padding: '6px 10px', minHeight: '36px' } : {}}
        >
          {compact ? '' : 'PHOTO'}
        </Button>

        <Button
          variant={isRecording ? 'primary' : 'glass'}
          size="sm"
          glow={isRecording}
          icon={isRecording ? <Square size={13} /> : <Video size={13} />}
          onClick={handleToggleRecord}
          title={isRecording ? 'Stop Recording' : 'Record Short Video (100% Client-Side Privacy)'}
          aria-label={isRecording ? `Stop video recording (${recordSeconds} seconds)` : 'Start recording video'}
          style={{
            ...(compact ? { padding: '6px 10px', minHeight: '36px' } : {}),
            ...(isRecording ? { background: '#ff3366', color: '#fff', borderColor: '#ff3366' } : {}),
          }}
        >
          {compact ? (isRecording ? `${recordSeconds}s` : '') : isRecording ? `REC ${recordSeconds}s` : 'RECORD'}
        </Button>
      </div>

      <CaptureModal
        isOpen={!!previewMediaUrl}
        type={previewType}
        mediaUrl={previewMediaUrl}
        onClose={handleCloseModal}
        onRetake={handleRetake}
      />
    </>
  );
};
