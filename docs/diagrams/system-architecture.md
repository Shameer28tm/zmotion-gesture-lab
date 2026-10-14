# System Architecture Diagram

This document contains the visual architectural topology of **ZMotion — Gesture Lab**.
It models the client-side data flows, computer vision pipeline, component lifecycles, and isolated execution domains.

> [!NOTE]
> ZMotion runs 100% in-browser. There are no backend databases, cloud storage buckets, or remote inference APIs.

```mermaid
flowchart TD
    %% Hardware & Input
    subgraph ClientHardware["Client Device & Hardware"]
        Webcam["Webcam Hardware (640x480 @ 30 FPS)"]
        UserTouch["Touchscreen / Keyboard / Mouse"]
    end

    %% Shared Core Infrastructure
    subgraph CoreLayer["Shared Core Infrastructure (Singleton Lifecycle)"]
        CameraManager["CameraManager\n- Persistent MediaStream singleton\n- Video element detachment/re-parenting\n- Playback watchdog"]
        
        MediaPipe["MediaPipe Hand Landmarker\n- WebAssembly delegate\n- Model asset: hand_landmarker.task\n- detectForVideo() timestamp sync"]
        
        GestureEngine["Shared GestureEngine\n- Inference loop (RAF ~30 FPS)\n- Watchdog (280ms hand loss timeout)\n- Telemetry (EMA latency, FPS)"]
        
        Smoother["GestureSmoother & Classifier\n- Exponential smoothing\n- Pinch calculation & palm normalization\n- Jump / Fist latching state machines"]
        
        GestureContext["GestureContext & React State\n- activeGesture, handedness, confidence\n- showSkeleton, isCameraActive\n- Normalized landmark coordinates"]
    end

    %% Overlays & Capture Layer
    subgraph OverlayCaptureLayer["Visualization & Capture Layer"]
        SkeletonOverlay["HandSkeletonOverlay\n- Canvas 2D overlay layer\n- Canonical 21-landmark skeleton\n- Object-fit cover scaling & mirroring\n- Decoupled from React renders"]
        
        CaptureService["MediaCaptureService\n- Canvas composition (Webcam + WebGL)\n- Client-side MediaRecorder (VP9/VP8/H.264)\n- Client-side PNG/WebM generation"]
    end

    %% Route-Specific 3D Experiences
    subgraph ExperienceLayer["Route-Specific 3D Experiences (Lazy Loaded)"]
        subgraph StudioDomain["Gesture Studio (/#studio)"]
            StudioCtrl["StudioSceneController\n- Three.js WebGLRenderer\n- Parametric solids (Sphere/Cube/Torus)\n- Mesh rotation lerp & pinch zoom"]
        end

        subgraph ParticleDomain["Particle Universe (/#particles)"]
            ParticleCtrl["ParticleSceneController\n- THREE.Points GPU engine\n- 5K / 15K / 30K particle tiers\n- Fibonacci sphere, Heart, Saturn, Flower, DNA\n- Kinetic centroid tilt & expansion"]
        end

        subgraph RunnerDomain["Gesture Runner (/#runner)"]
            RunnerCtrl["RunnerSceneController & Engine\n- 3-Lane cyber runway track\n- Continuous steering & jump latching\n- Obstacle procedural generation\n- Manual touch & arrow fallback"]
            HighScoreStorage["Browser localStorage\n- Key: zmotion_runner_highscore"]
        end
    end

    %% User Outputs
    subgraph UserOutputs["Client-Side Outputs & Downloads"]
        ScreenOutput["Screen Display (WebGL Canvas + HUD)"]
        FileDownload["Direct Local Download\n(zmotion-capture-*.png / *.webm)"]
    end

    %% Connections
    Webcam -->|MediaStream| CameraManager
    CameraManager -->|HTMLVideoElement| MediaPipe
    MediaPipe -->|Raw 21 3D Landmarks| GestureEngine
    GestureEngine -->|Landmarks & Handedness| Smoother
    Smoother -->|Smoothed Gestures & State| GestureContext

    %% Camera & Skeleton
    CameraManager -.->|Frame synchronization| SkeletonOverlay
    GestureEngine -.->|Real-time landmarks| SkeletonOverlay
    SkeletonOverlay --> ScreenOutput

    %% Context to Experiences
    GestureContext -->|Spatial Rotations & Scales| StudioCtrl
    GestureContext -->|Centroid & Pinch Expansion| ParticleCtrl
    GestureContext -->|Lane Steering & Fist Jump| RunnerCtrl

    %% Touch fallback to Runner
    UserTouch -->|Touch / Keyboard input| RunnerCtrl
    RunnerCtrl <-->|Persist / Read| HighScoreStorage

    %% 3D to Screen
    StudioCtrl --> ScreenOutput
    ParticleCtrl --> ScreenOutput
    RunnerCtrl --> ScreenOutput

    %% Capture Connections
    CameraManager -.->|Video pixels| CaptureService
    StudioCtrl -.->|preserveDrawingBuffer| CaptureService
    ParticleCtrl -.->|preserveDrawingBuffer| CaptureService
    RunnerCtrl -.->|preserveDrawingBuffer| CaptureService
    CaptureService -->|User-initiated Blob URL| FileDownload
```

## Shared vs. Route-Specific Architecture

| Component | Shared / Route-Specific | Description |
| :--- | :--- | :--- |
| `CameraManager` | **Shared Singleton** | Manages a single active `MediaStream` and `HTMLVideoElement` across all routes. Prevents hardware re-initialization and permission prompts. |
| `GestureEngine` | **Shared Singleton** | Coordinates MediaPipe vision inference loop, FPS tracking, and hand-loss timeout watchdog. |
| `GestureContext` | **Shared State** | Exposes reactive gesture tokens (`OPEN_PALM`, `PINCH`, `FIST`, `POINTING`) and hand tracking status. |
| `HandSkeletonOverlay` | **Shared Layer** | Transparent 2D canvas overlay hooked directly to `GestureEngine.onFrame` with zero React re-renders. |
| `MediaCaptureService` | **Shared Service** | In-memory frame compositor and `MediaRecorder` pipeline. Produces local client blobs. |
| `StudioSceneController` | **Route-Specific** | Three.js scene containing parametric 3D meshes, directional lights, and orientation smoothing. |
| `ParticleSceneController` | **Route-Specific** | GPU particle simulation with 5 shape manifolds, morphing interpolations, and expansion kinetics. |
| `RunnerSceneController` | **Route-Specific** | Game loop, lane physics, obstacle spawn system, collision detection, and score tracking. |
