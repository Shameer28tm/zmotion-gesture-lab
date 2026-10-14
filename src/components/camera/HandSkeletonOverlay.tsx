import React, { useEffect, useRef } from 'react';
import { useGestureEngine } from '../../core/engine/GestureContext';
import { HandSkeletonRenderer } from '../../core/vision/HandSkeletonRenderer';

export interface HandSkeletonOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isVisible?: boolean;
}

export const HandSkeletonOverlay: React.FC<HandSkeletonOverlayProps> = ({
  containerRef,
  isVisible = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<HandSkeletonRenderer | null>(null);
  const { engine } = useGestureEngine();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new HandSkeletonRenderer(canvas);
    rendererRef.current = renderer;

    const updateDimensions = () => {
      const container = containerRef.current;
      if (!container || !rendererRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      rendererRef.current.resize(width, height);
    };

    updateDimensions();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(containerRef.current);
    }

    const handleWindowResize = () => {
      updateDimensions();
    };
    window.addEventListener('resize', handleWindowResize);

    // High-frequency subscription: runs per animation frame, decoupled from React renders
    const unsubscribeFrame = engine.onFrame((state, primaryLandmarks, allHands) => {
      if (!isVisible || !containerRef.current) {
        rendererRef.current?.clear();
        return;
      }

      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const video = engine.getVideoElement();
      const videoWidth = video && video.videoWidth > 0 ? video.videoWidth : 640;
      const videoHeight = video && video.videoHeight > 0 ? video.videoHeight : 480;

      if (allHands && allHands.length > 0) {
        const renderItems = allHands.map((h) => ({
          landmarks: h.smoothedLandmarks,
          gesture: h.gesture,
          handedness: h.handedness,
          metrics: h.metrics,
          id: h.id,
          isGracePeriod: h.isGracePeriod,
        }));
        rendererRef.current?.renderHands(
          renderItems,
          width,
          height,
          videoWidth,
          videoHeight
        );
      } else if (primaryLandmarks && state.handDetected) {
        rendererRef.current?.render(
          primaryLandmarks,
          width,
          height,
          videoWidth,
          videoHeight,
          state
        );
      } else {
        rendererRef.current?.clear();
      }
    });

    return () => {
      unsubscribeFrame();
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver?.disconnect();
      rendererRef.current?.clear();
      rendererRef.current = null;
    };
  }, [engine, containerRef, isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className="hand-skeleton-canvas"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 3,
        pointerEvents: 'none',
      }}
    />
  );
};
