import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { GestureEngine } from './GestureEngine';
import type { CameraStatus, GestureState, EngineDiagnostics } from '../types';

interface GestureContextValue {
  engine: GestureEngine;
  cameraStatus: CameraStatus;
  gestureState: GestureState;
  diagnostics: EngineDiagnostics;
  errorMessage: string | null;
  isRunning: boolean;
  startEngine: (videoElement?: HTMLVideoElement) => Promise<void>;
  stopEngine: () => void;
  setSensitivity: (val: number) => void;
  setSmoothing: (val: number) => void;
  showSkeleton: boolean;
  setShowSkeleton: (val: boolean) => void;
}

const GestureContext = createContext<GestureContextValue | null>(null);

export const GestureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const engine = useMemo(() => GestureEngine.getInstance(), []);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>(engine.getStatus());
  const [gestureState, setGestureState] = useState<GestureState>(engine.getState());
  const [diagnostics, setDiagnostics] = useState<EngineDiagnostics>(engine.getDiagnostics());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);

  useEffect(() => {
    const unsubCamera = engine.onCameraStatusChange((status, error) => {
      setCameraStatus(status);
      setErrorMessage(error ?? null);
    });

    const unsubState = engine.onStateChange((state) => {
      setGestureState(state);
    });

    // Throttled diagnostics update (2 times/sec is plenty for telemetry display without render overhead)
    let lastDiagUpdate = 0;
    const unsubDiagnostics = engine.onDiagnostics((diag) => {
      const now = performance.now();
      if (now - lastDiagUpdate >= 450) {
        lastDiagUpdate = now;
        setDiagnostics(diag);
      }
    });

    return () => {
      unsubCamera();
      unsubState();
      unsubDiagnostics();
    };
  }, [engine]);

  const startEngine = async (videoElement?: HTMLVideoElement) => {
    try {
      setErrorMessage(null);
      await engine.start(videoElement);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message);
    }
  };

  const stopEngine = () => {
    engine.stop();
  };

  const setSensitivity = (val: number) => {
    engine.setConfig({ sensitivity: val });
  };

  const setSmoothing = (val: number) => {
    engine.setConfig({ smoothingAlpha: val });
  };

  const isRunning = cameraStatus === 'streaming';

  return (
    <GestureContext.Provider
      value={{
        engine,
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
      }}
    >
      {children}
    </GestureContext.Provider>
  );
};

export const useGestureEngine = (): GestureContextValue => {
  const context = useContext(GestureContext);
  if (!context) {
    throw new Error('useGestureEngine must be used within a GestureProvider');
  }
  return context;
};
