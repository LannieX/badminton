import { MeshGradient } from '@paper-design/shaders-react';
import { useReducedMotion } from 'framer-motion';
import { meshColors } from '../lib/background-theme';

export default function AppBackground() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="app-background" aria-hidden="true">
      {!reduceMotion && (
        <MeshGradient colors={meshColors} speed={0.2} style={{ width: '100%', height: '100%' }} />
      )}
      <div className="app-background-scrim" />
    </div>
  );
}
