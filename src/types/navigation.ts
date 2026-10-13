export type ExperienceRoute = 'home' | 'studio' | 'particles' | 'runner' | 'about';

export interface NavItem {
  id: ExperienceRoute;
  label: string;
  badge?: string;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Overview', description: 'Interactive Platform Gateway' },
  { id: 'studio', label: 'Gesture Studio', badge: '3D Mesh', description: 'Sphere, Cube & Torus Manipulation' },
  { id: 'particles', label: 'Particle Universe', badge: '15K Cloud', description: 'Morphing Mathematical Shapes' },
  { id: 'runner', label: 'Gesture Games', badge: 'Runner', description: 'Endless 3D Cyber Runner' },
  { id: 'about', label: 'Tech & Architecture', description: 'Specifications & Gesture Manual' },
];
