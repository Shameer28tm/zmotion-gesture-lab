import React, { useEffect, useRef } from 'react';
import { X, Sliders } from 'lucide-react';
import { Button } from '../ui/Button';

export interface MobileControlDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: string;
  children: React.ReactNode;
}

export const MobileControlDrawer: React.FC<MobileControlDrawerProps> = ({
  isOpen,
  onClose,
  title,
  badge,
  children,
}) => {
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="mobile-drawer-portal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Dimmed backdrop - click to close */}
      <div
        className="mobile-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(3, 5, 12, 0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Slide-up bottom sheet */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-drawer-title"
        className="mobile-drawer-sheet"
        style={{
          position: 'relative',
          width: '100%',
          maxHeight: '85dvh',
          background: 'linear-gradient(180deg, rgba(12, 18, 34, 0.98) 0%, rgba(6, 10, 20, 0.99) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--border-glass)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 210, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          overflow: 'hidden',
          animation: 'slideUpDrawer 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Grab Handle & Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 16px 8px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          {/* Visual pill handle */}
          <div
            style={{
              width: '36px',
              height: '4px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.25)',
              marginBottom: '10px',
            }}
          />

          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="var(--electric-cyan)" />
              <h2
                id="mobile-drawer-title"
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: '0.02em',
                }}
              >
                {title}
              </h2>
              {badge && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--electric-cyan)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(0, 245, 212, 0.1)',
                    border: '1px solid rgba(0, 245, 212, 0.3)',
                  }}
                >
                  {badge}
                </span>
              )}
            </div>

            <Button
              variant="glass"
              size="sm"
              icon={<X size={16} />}
              onClick={onClose}
              aria-label="Close controls drawer"
              style={{
                minWidth: '40px',
                minHeight: '40px',
                padding: '8px',
                borderRadius: '8px',
              }}
            >
              Done
            </Button>
          </div>
        </div>

        {/* Scrollable controls content */}
        <div
          className="mobile-drawer-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '16px',
            paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slideUpDrawer {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
