import React, { useEffect, useRef } from 'react';
import { useGestureEngine } from '../../core/engine/GestureContext';

export interface CameraBackdropProps {
  className?: string;
  style?: React.CSSProperties;
}

export const CameraBackdrop: React.FC<CameraBackdropProps> = ({ className = '', style }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { engine, isRunning } = useGestureEngine();

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    engine.attachCameraToContainer(container);

    return () => {
      engine.detachCameraFromContainer(container);
    };
  }, [engine]);

  return (
    <div
      ref={containerRef}
      className={`camera-backdrop-layer ${className}`}
      style={style}
      aria-hidden="true"
    >
      {isRunning && <div className="camera-vignette-overlay" />}
    </div>
  );
};
