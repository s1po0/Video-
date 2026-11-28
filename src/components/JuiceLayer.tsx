import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  symbol: string;
  size: number;
}

export function triggerHaptic(tier: 'small' | 'medium' | 'large') {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (tier === 'small') navigator.vibrate(12);
      else if (tier === 'medium') navigator.vibrate([20, 30, 20]);
      else navigator.vibrate([35, 40, 55, 30, 40]);
    }
  } catch {
    // Ignore unsupported devices
  }
}

/**
 * Implements Squirrel Eiserloh / awesome-gamedev-agent-skills `game-feel`
 * trauma^2 summed-sine camera shake (never buzzes randomly, always decays to exact 0).
 */
export function useTraumaShake(enabled = true) {
  const traumaRef = useRef(0);
  const timeRef = useRef(0);
  const [offset, setOffset] = useState({ x: 0, y: 0, rot: 0 });

  const addTrauma = useCallback(
    (amount: number) => {
      if (!enabled) return;
      traumaRef.current = Math.min(1, traumaRef.current + amount);
    },
    [enabled]
  );

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (traumaRef.current > 0) {
        traumaRef.current = Math.max(0, traumaRef.current - 1.35 * dt);
        const shake = traumaRef.current * traumaRef.current;
        timeRef.current += dt * 32;
        if (traumaRef.current === 0) {
          setOffset({ x: 0, y: 0, rot: 0 });
        } else {
          setOffset({
            x: 11 * shake * Math.sin(timeRef.current * 1.7),
            y: 8 * shake * Math.sin(timeRef.current * 2.3),
            rot: 0.9 * shake * Math.sin(timeRef.current * 1.1),
          });
        }
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return { offset, addTrauma };
}

export const ParticleBurstCanvas: React.FC<{
  burstSignal: { id: number; x: number; y: number; kind: 'heart' | 'flame' | 'gold' } | null;
}> = ({ burstSignal }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<BurstParticle[]>([]);

  useEffect(() => {
    if (!burstSignal) return;
    const symbols =
      burstSignal.kind === 'heart'
        ? ['❤️', '💖', '✨', '💕']
        : burstSignal.kind === 'flame'
        ? ['🔥', '❤️‍🔥', '✨', '💋']
        : ['🪙', '✨', '💎'];

    const count = burstSignal.kind === 'flame' ? 18 : 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 2.2 + Math.random() * 4.5;
      particlesRef.current.push({
        x: burstSignal.x || window.innerWidth / 2,
        y: burstSignal.y || window.innerHeight * 0.55,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.2,
        life: 0,
        maxLife: 45 + Math.random() * 22,
        symbol: symbols[i % symbols.length],
        size: 16 + Math.random() * 12,
      });
    }
  }, [burstSignal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const next: BurstParticle[] = [];
      for (const p of particlesRef.current) {
        p.life += 1;
        if (p.life < p.maxLife) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.11;
          const alpha = 1 - p.life / p.maxLife;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.font = `${Math.round(p.size)}px sans-serif`;
          ctx.fillText(p.symbol, p.x, p.y);
          ctx.restore();
          next.push(p);
        }
      }
      particlesRef.current = next;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 110,
      }}
    />
  );
};
