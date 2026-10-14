import React from 'react';
import { Box, Sparkles, Gamepad2, ArrowRight, ShieldCheck } from 'lucide-react';
import type { ExperienceRoute } from '../../types/navigation';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CosmicSpaceBackground } from '../../components/ui/CosmicSpaceBackground';

export interface HomeLandingProps {
  onNavigate: (route: ExperienceRoute) => void;
  onOpenOnboarding: () => void;
}

export const HomeLanding: React.FC<HomeLandingProps> = ({ onNavigate }) => {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 24px 80px',
        overflow: 'hidden',
      }}
    >
      {/* Lightweight 2D Cosmic Space Background */}
      <CosmicSpaceBackground />

      {/* Main Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1180px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '56px',
        }}
      >
        {/* Brand Monogram & Slogan Anchor */}
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
            paddingTop: '20px',
          }}
        >
          {/* Brand Signature Slogan */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: 'rgba(0, 210, 255, 0.08)',
              border: '1px solid rgba(0, 210, 255, 0.22)',
              boxShadow: '0 0 20px rgba(0, 210, 255, 0.12)',
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--electric-cyan)',
              fontWeight: 600,
            }}
          >
            Leverage Early. Move Differently. Sky Is the Limit.
          </div>

          {/* Aesthetic Editorial Developer Credit */}
          <div
            className="developer-credit-tag"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.04em',
              color: 'var(--text-muted)',
              marginTop: '-4px',
            }}
          >
            <span>Developed by</span>
            <a
              href="https://www.linkedin.com/in/shameerion"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Developer LinkedIn Profile: Shameer TM (opens in new tab)"
              style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 600,
                borderBottom: '1px solid rgba(0, 210, 255, 0.4)',
                paddingBottom: '1px',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--electric-cyan)';
                e.currentTarget.style.borderBottomColor = 'var(--electric-cyan)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderBottomColor = 'rgba(0, 210, 255, 0.4)';
              }}
            >
              Shameer TM
            </a>
          </div>

          {/* Exact Required H1 Under 75 Characters */}
          <h1
            style={{
              fontSize: 'clamp(36px, 5.5vw, 62px)',
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: '920px',
              margin: '8px 0 0',
              letterSpacing: '-0.025em',
              color: '#ffffff',
            }}
          >
            <span
              style={{
                color: 'var(--electric-blue)',
                textShadow: '0 0 30px rgba(0, 210, 255, 0.35)',
              }}
            >
              ZMotion
            </span>
            : Real-Time Hand Gesture Control in 3D
          </h1>

          {/* Concise, Human-Readable Product Description */}
          <p
            style={{
              fontSize: 'clamp(16px, 1.8vw, 19px)',
              color: 'var(--text-secondary)',
              maxWidth: '640px',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Turn your webcam into a touch-free creative space. Move, shape, and play with hand gestures — privately, right in your browser.
          </p>
        </header>

        {/* Central Privacy Promise Message */}
        <section
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            width: '100%',
          }}
          aria-label="User Privacy Commitment"
        >
          <div
            style={{
              padding: '24px 28px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(8, 14, 28, 0.85) 0%, rgba(14, 22, 40, 0.7) 100%)',
              border: '1px solid rgba(0, 210, 255, 0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 25px rgba(0, 210, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(0, 255, 136, 0.12)',
                border: '1px solid rgba(0, 255, 136, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)',
              }}
            >
              <ShieldCheck size={26} color="#00ff88" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#00ff88',
                }}
              >
                100% USER-SIDE PRIVACY
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                Your camera is yours. Explore, create, capture, and download — without uploading your photos or videos to our servers.
              </p>
            </div>
          </div>
        </section>

        {/* 3 Interactive Experience Doorways */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
          }}
          aria-label="Interactive 3D Experiences"
        >
          {/* Card 1: Gesture Studio */}
          <Card
            cyberCorners
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
              background: 'rgba(8, 13, 26, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 210, 255, 0.2)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(0, 210, 255, 0.1)',
                    border: '1px solid rgba(0, 210, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--electric-blue)',
                  }}
                >
                  <Box size={22} />
                </div>
                <Badge label="STUDIO" variant="blue" />
              </div>

              <h2 style={{ fontSize: '20px', color: '#fff', margin: 0, fontWeight: 700 }}>
                Gesture Studio
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                Manipulate solid & wireframe 3D meshes using hand centroid rotation, two-finger pinch scaling, and fingertip color transitions.
              </p>
            </div>

            <Button
              variant="glass"
              size="md"
              icon={<ArrowRight size={15} />}
              onClick={() => onNavigate('studio')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Open Gesture Studio
            </Button>
          </Card>

          {/* Card 2: Particle Universe */}
          <Card
            cyberCorners
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
              background: 'rgba(8, 13, 26, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 210, 255, 0.35)',
              boxShadow: '0 0 30px rgba(0, 210, 255, 0.12)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(0, 245, 212, 0.1)',
                    border: '1px solid rgba(0, 245, 212, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--electric-cyan)',
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <Badge label="15K PARTICLES" variant="live" pulse />
              </div>

              <h2 style={{ fontSize: '20px', color: '#fff', margin: 0, fontWeight: 700 }}>
                Particle Universe
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                A 15,000-particle cloud dynamically morphing between Sphere, Heart, Saturn, Flower, and DNA with fist triggers and pinch expansion.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              glow
              icon={<ArrowRight size={15} />}
              onClick={() => onNavigate('particles')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Launch Particle Universe
            </Button>
          </Card>

          {/* Card 3: Gesture Runner */}
          <Card
            cyberCorners
            style={{
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
              background: 'rgba(8, 13, 26, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 170, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(255, 170, 0, 0.1)',
                    border: '1px solid rgba(255, 170, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffaa00',
                  }}
                >
                  <Gamepad2 size={22} />
                </div>
                <Badge label="ARCADE 3D" variant="warn" />
              </div>

              <h2 style={{ fontSize: '20px', color: '#fff', margin: 0, fontWeight: 700 }}>
                Endless Cyber Runner
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                Dodge procedural highway hazard blocks by moving your hand horizontally and jumping over barriers with a quick fist action.
              </p>
            </div>

            <Button
              variant="glass"
              size="md"
              icon={<ArrowRight size={15} />}
              onClick={() => onNavigate('runner')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Play Cyber Runner
            </Button>
          </Card>
        </section>

        {/* Landing Page Social Links */}
        <footer
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            paddingTop: '12px',
          }}
          aria-label="Direct Social Profiles"
        >
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
            }}
          >
            CONNECT WITH THE CREATOR & STUDIO
          </span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/shameerion"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn profile of Shameer (opens in new tab)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(14, 22, 40, 0.65)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--electric-blue)';
                e.currentTarget.style.borderColor = 'var(--electric-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-glass)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span>LinkedIn</span>
            </a>

            {/* Personal Instagram */}
            <a
              href="https://instagram.com/shameerion"
              target="_blank"
              rel="noreferrer"
              aria-label="Personal Instagram of Shameer (opens in new tab)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(14, 22, 40, 0.65)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--electric-cyan)';
                e.currentTarget.style.borderColor = 'var(--electric-cyan)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-glass)';
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              <span>Personal Instagram</span>
            </a>

            {/* Zcloud Digitech Instagram */}
            <a
              href="https://instagram.com/zcloud_digitech"
              target="_blank"
              rel="noreferrer"
              aria-label="Zcloud Digitech Studio Instagram (opens in new tab)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(14, 22, 40, 0.65)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffaa00';
                e.currentTarget.style.borderColor = '#ffaa00';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-glass)';
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              <span>Zcloud Digitech</span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};
