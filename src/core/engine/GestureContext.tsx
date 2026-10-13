import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { GestureEngine } from './GestureEngine';
import type { CameraStatus, GestureState } from '../types';

interface GestureContextValue {
  engine: GestureEngine;
  cameraStatus: CameraStatus;
  gestureState: GestureState;
  errorMessage: string | null;
  isRunning: boolean;
  startEngine: (videoElement?: HTMLVideoElement) => Promise<void>;
  stopEngine: () => void;
  setSensitivity: (val: number) => void;
  setSmoothing: (val: number) => void;
}

const GestureContext = createContext<GestureContextValue | null>(null);

export const GestureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const engine = useMemo(() => GestureEngine.getInstance(), []);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>(engine.getStatus());
  const [gestureState, setGestureState] = useState<GestureState>(engine.getState());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubCamera = engine.onCameraStatusChange((status, error) => {
      setCameraStatus(status);
      setErrorMessage(error ?? null);
    });

    const unsubState = engine.onStateChange((state) => {
      setGestureState(state);
    });

    return () => {
      unsubCamera();
      unsubState();
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
        errorMessage,
        isRunning,
        startEngine,
        stopEngine,
        setSensitivity,
        setSmoothing,
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
