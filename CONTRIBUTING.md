# Contributing to ZMotion — Gesture Lab

Thank you for your interest in contributing to **ZMotion — Gesture Lab**! We welcome bug fixes, documentation improvements, performance optimizations, and feature enhancements.

---

## 1. Code of Conduct

Please maintain a collaborative, respectful, and professional environment. Focus on constructive feedback and rigorous engineering.

---

## 2. Getting Started

### Prerequisites
- **Node.js**: 18+ (Node 20+ LTS recommended)
- **npm**: 9+
- A working webcam and a WebGL 2.0 / WebAssembly capable browser (Chrome, Edge, Firefox, or Safari).

### Local Setup
```bash
# Clone your fork
git clone https://github.com/<your-username>/zmotion-gesture-lab.git
cd zmotion-gesture-lab

# Install dependencies cleanly
npm ci

# Start local Vite development server
npm run dev
```

Visit `http://localhost:5173` to test the application.

---

## 3. Development Workflow & Expectations

### Running Automated Tests
```bash
# Run Vitest test suite
npm test

# Run Vitest once (CI mode)
npm test -- --run
```

### Type Checking & Production Build
```bash
# Verify TypeScript strict type-checking and build production chunks
npm run build
```

### Testing Webcam & Computer Vision
- Ensure your webcam permissions are enabled in your browser settings.
- If you do not have a physical webcam available during automated tests, all Vitest test suites run in headless JSDOM with mocked video and canvas stubs.
- In manual testing, test the three experiences (`#studio`, `#particles`, `#runner`) and verify that hand gesture rotation, pinch zoom, and fist latching function accurately.
- When testing mobile layouts, use Chrome DevTools Device Mode to verify breakpoints: 320px, 360px, 375px, 390px, 430px, 768px, 1024px.

---

## 4. Pull Request Guidelines

1. **Create a Topic Branch**: Branch off `main` with a clear prefix (e.g. `fix/mobile-drawer-close`, `feat/particle-shape`).
2. **Adhere to Code Standards**:
   - Write clean, type-safe TypeScript.
   - Do NOT add large third-party dependencies for simple UI behaviors.
   - Preserve existing working features and zero-server privacy architecture.
3. **Add Tests**: Include regression tests in `src/test/` for any new functionality or bug fix.
4. **Pass CI**: Ensure `npm test -- --run` and `npm run build` pass before submitting.
5. **Use Conventional Commits**: E.g. `feat: add palm ripple effect`, `fix: clamp skeleton canvas DPR on mobile`.
