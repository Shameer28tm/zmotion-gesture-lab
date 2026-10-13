import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import type { ExperienceRoute } from './types/navigation';
import { HomeLanding } from './experiences/home/HomeLanding';
import { GestureStudioPlaceholder } from './experiences/studio/GestureStudioPlaceholder';
import { ParticleUniversePlaceholder } from './experiences/particles/ParticleUniversePlaceholder';
import { GestureRunnerPlaceholder } from './experiences/runner/GestureRunnerPlaceholder';
import { AboutExperience } from './experiences/about/AboutExperience';

export const App: React.FC = () => {
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
        return <GestureStudioPlaceholder />;
      case 'particles':
        return <ParticleUniversePlaceholder />;
      case 'runner':
        return <GestureRunnerPlaceholder />;
      case 'about':
        return <AboutExperience />;
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

export default App;
