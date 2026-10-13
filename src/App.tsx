import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import type { ExperienceRoute } from './types/navigation';
import { HomeLanding } from './experiences/home/HomeLanding';
import { GestureProvider } from './core/engine/GestureContext';

// Route-level code splitting for experiences not required initially
const GestureStudio = lazy(() =>
  import('./experiences/studio/GestureStudio').then((m) => ({ default: m.GestureStudio }))
);
const ParticleUniverse = lazy(() =>
  import('./experiences/particles/ParticleUniverse').then((m) => ({
    default: m.ParticleUniverse,
  }))
);
const GestureRunnerPlaceholder = lazy(() =>
  import('./experiences/runner/GestureRunnerPlaceholder').then((m) => ({
    default: m.GestureRunnerPlaceholder,
  }))
);
const AboutExperience = lazy(() =>
  import('./experiences/about/AboutExperience').then((m) => ({ default: m.AboutExperience }))
);

const RouteLoadingFallback: React.FC<{ title: string }> = ({ title }) => (
  <div
    role="status"
    aria-live="polite"
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '16px',
    }}
  >
    <div className="led-indicator live" style={{ width: '14px', height: '14px' }} />
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: 'var(--electric-cyan)',
        letterSpacing: '0.08em',
      }}
    >
      LOADING {title.toUpperCase()}...
    </span>
  </div>
);

export const AppContent: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<ExperienceRoute>('home');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Sync hash routing for shareability and browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ExperienceRoute;
      if (['home', 'studio', 'particles', 'runner', 'about'].includes(hash)) {
        setCurrentRoute(hash);
      }
    };

    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (route: ExperienceRoute) => {
    setCurrentRoute(route);
    window.location.hash = route === 'home' ? '' : route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActiveRoute = () => {
    switch (currentRoute) {
      case 'studio':
        return (
          <Suspense fallback={<RouteLoadingFallback title="Gesture Studio" />}>
            <GestureStudio />
          </Suspense>
        );
      case 'particles':
        return (
          <Suspense fallback={<RouteLoadingFallback title="Particle Universe" />}>
            <ParticleUniverse />
          </Suspense>
        );
      case 'runner':
        return (
          <Suspense fallback={<RouteLoadingFallback title="Gesture Runner" />}>
            <GestureRunnerPlaceholder />
          </Suspense>
        );
      case 'about':
        return (
          <Suspense fallback={<RouteLoadingFallback title="Technical Specification" />}>
            <AboutExperience />
          </Suspense>
        );
      case 'home':
      default:
        return (
          <HomeLanding
            onNavigate={handleNavigate}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      {/* Background Cyber Grid Accent */}
      <div className="cyber-grid-overlay" />

      {/* Persistent Navigation */}
      <Navbar
        currentRoute={currentRoute}
        onRouteChange={handleNavigate}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Main Experience Viewport */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {renderActiveRoute()}
      </main>

      {/* Persistent Technical Footer */}
      <Footer />

      {/* Global Controls & Calibration Guide Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GestureProvider>
      <AppContent />
    </GestureProvider>
  );
};

export default App;
