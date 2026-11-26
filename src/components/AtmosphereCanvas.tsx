import React, { useEffect, useRef } from 'react';
import { AtmosphereMode } from '../types/story';

interface Props {
  mode: AtmosphereMode;
  intensity?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
}

export const AtmosphereCanvas: React.FC<Props> = ({ mode, intensity = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const count = mode === 'rain_storm' ? 75 : mode === 'balcony_mist' ? 55 : 38;
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx:
        mode === 'rain_storm' || mode === 'balcony_mist'
          ? -1.4 - Math.random() * 1.2
          : (Math.random() - 0.5) * 0.45,
      vy:
        mode === 'rain_storm'
          ? 9 + Math.random() * 6
          : mode === 'balcony_mist'
          ? 5 + Math.random() * 4
          : -0.35 - Math.random() * 0.65,
      size:
        mode === 'rain_storm' || mode === 'balcony_mist'
          ? 12 + Math.random() * 16
          : 2 + Math.random() * 4.5,
      alpha: 0.18 + Math.random() * 0.45,
      hue: mode === 'candle_embers' ? 28 + Math.random() * 22 : 335 + Math.random() * 35,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        if (mode === 'rain_storm' || mode === 'balcony_mist') {
          ctx.strokeStyle = `rgba(210, 228, 255, ${p.alpha * 0.42 * intensity})`;
          ctx.lineWidth = 1.15;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.6, p.y + p.size);
          ctx.stroke();

          p.x += p.vx;
          p.y += p.vy;
          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * (width + 120);
          }
          if (p.x < -40) p.x = width + 20;
        } else {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.4);
          grad.addColorStop(0, `hsla(${p.hue}, 95%, 72%, ${p.alpha * 0.75})`);
          grad.addColorStop(1, `hsla(${p.hue}, 95%, 60%, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.vx + Math.sin(p.y * 0.02) * 0.25;
          p.y += p.vy;
          if (p.y < -20) {
            p.y = height + 20;
            p.x = Math.random() * width;
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [mode, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="atmosphere-canvas"
      aria-hidden="true"
    />
  );
};
