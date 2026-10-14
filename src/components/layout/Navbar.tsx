import React, { useState } from 'react';
import { Box, Sparkles, Gamepad2, Menu, X, Activity, HelpCircle } from 'lucide-react';
import { type ExperienceRoute, NAV_ITEMS } from '../../types/navigation';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface NavbarProps {
  currentRoute: ExperienceRoute;
  onRouteChange: (route: ExperienceRoute) => void;
  onOpenOnboarding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onRouteChange,
  onOpenOnboarding,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRouteIcon = (route: ExperienceRoute) => {
    switch (route) {
      case 'studio':
        return <Box size={16} />;
      case 'particles':
        return <Sparkles size={16} />;
      case 'runner':
        return <Gamepad2 size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  return (
    <header
      style={{
        height: 'var(--navbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: 'rgba(5, 7, 13, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-glass)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
        onClick={() => onRouteChange('home')}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
            border: '1px solid var(--electric-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--electric-glow-subtle)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '16px',
              color: 'var(--electric-blue)',
            }}
          >
            Z
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: '#fff' }}>
              ZMOTION
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--electric-blue)',
                padding: '1px 6px',
                borderRadius: '4px',
                background: 'rgba(0, 210, 255, 0.1)',
                border: '1px solid rgba(0, 210, 255, 0.25)',
              }}
            >
              GESTURE LAB
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Navigation links */}
      <nav
        style={{
          display: 'none',
          gap: '6px',
          background: 'rgba(14, 22, 40, 0.5)',
          padding: '4px',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
        className="desktop-nav"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onRouteChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: isActive ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
                color: isActive ? 'var(--electric-blue)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                boxShadow: isActive ? 'var(--electric-glow-subtle)' : 'none',
              }}
            >
              {getRouteIcon(item.id)}
              <span>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: isActive ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Actions & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Badge label="VISION ENGINE" variant="live" pulse className="desktop-badge" />

        <Button
          variant="glass"
          size="sm"
          icon={<HelpCircle size={15} />}
          onClick={onOpenOnboarding}
          title="Controls Guide & Gesture Reference"
        >
          Controls
        </Button>

        {/* Mobile Hamburger */}
        <button
          className="mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
          style={{
            display: 'none',
            background: 'transparent',
            border: '1px solid var(--border-glass)',
            borderRadius: '6px',
            color: '#fff',
            padding: '8px',
            cursor: 'pointer',
          }}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--navbar-height)',
            left: 0,
            right: 0,
            background: 'rgba(8, 13, 26, 0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-glass)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 60,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onRouteChange(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--electric-blue)' : 'var(--border-subtle)',
                  background: isActive ? 'rgba(0, 210, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  color: isActive ? 'var(--electric-blue)' : '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {getRouteIcon(item.id)}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{item.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .desktop-badge { display: inline-flex !important; }
          .mobile-hamburger-btn { display: none !important; }
        }
        @media (max-width: 899px) {
          .desktop-nav { display: none !important; }
          .desktop-badge { display: none !important; }
          .mobile-hamburger-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
};
