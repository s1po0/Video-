import { loc } from '../data/catalog';
import { Locale } from '../types/game';
import { RoomLabelZone, WorldFloorData, WorldVfxZone } from '../data/worldFloors';

export interface RippleRing {
  x: number;
  y: number;
  r: number;
  alpha: number;
  color?: string;
}

export interface FootstepSpark {
  x: number;
  y: number;
  alpha: number;
}

export function drawWorldVfx(
  ctx: CanvasRenderingContext2D,
  z: WorldVfxZone,
  timeSec: number
) {
  ctx.save();
  if (z.kind === 'pool_water') {
    ctx.globalCompositeOperation = 'lighter';
    // Shimmering caustic wave bands across the turquoise pool
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.24)';
    ctx.lineWidth = 3;
    for (let row = 0; row < 7; row++) {
      const baseY = z.y + 45 + row * 68;
      ctx.beginPath();
      for (let x = z.x + 20; x < z.x + z.w - 20; x += 28) {
        const wy = baseY + Math.sin(x * 0.022 + timeSec * 2.8 + row) * 9;
        if (x === z.x + 20) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }
    // Twinkling diamond water sparkles
    for (let i = 0; i < 18; i++) {
      const sx = z.x + 40 + ((i * 137 + Math.sin(timeSec + i) * 22) % (z.w - 80));
      const sy = z.y + 35 + ((i * 89 + Math.cos(timeSec * 1.3 + i) * 18) % (z.h - 70));
      const tw = Math.max(0, Math.sin(timeSec * 4.2 + i * 1.7));
      ctx.fillStyle = `rgba(224, 242, 254, ${tw * 0.75})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.2 + tw * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (z.kind === 'jacuzzi_steam') {
    // Rising warm steam & champagne bubbles
    for (let i = 0; i < 9; i++) {
      const bx = z.x + z.w * 0.22 + ((i * 39 + Math.sin(timeSec * 2 + i) * 14) % (z.w * 0.58));
      const prog = ((timeSec * 0.42 + i * 0.13) % 1);
      const by = z.y + z.h * 0.75 - prog * (z.h * 0.85);
      const alpha = (1 - prog) * 0.34;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(bx, by, 12 + prog * 18, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (z.kind === 'rose_bath') {
    // Swirling crimson rose petals & golden steam
    for (let i = 0; i < 8; i++) {
      const ang = timeSec * 0.9 + i * 0.8;
      const px = z.x + z.w / 2 + Math.cos(ang) * (24 + (i % 3) * 12);
      const py = z.y + z.h / 2 + Math.sin(ang * 1.2) * (45 + (i % 2) * 20);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(244, 63, 94, 0.85)' : 'rgba(251, 191, 36, 0.75)';
      ctx.beginPath();
      ctx.ellipse(px, py, 5, 3, ang, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (z.kind === 'fireplace') {
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.24 + Math.sin(timeSec * 9) * 0.06;
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 150);
    grad.addColorStop(0, `rgba(251, 191, 36, ${pulse})`);
    grad.addColorStop(0.5, `rgba(249, 115, 22, ${pulse * 0.5})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 150, 0, Math.PI * 2);
    ctx.fill();
  } else if (z.kind === 'jazz_notes') {
    const notes = ['♪', '♫', '♬'];
    ctx.font = '700 20px system-ui';
    for (let i = 0; i < 5; i++) {
      const prog = (timeSec * 0.32 + i * 0.2) % 1;
      const nx = z.x + 70 + i * 85 + Math.sin(timeSec * 2.2 + i) * 16;
      const ny = z.y + 180 - prog * 140;
      ctx.fillStyle = `rgba(253, 224, 71, ${(1 - prog) * 0.85})`;
      ctx.fillText(notes[i % 3], nx, ny);
    }
  } else if (z.kind === 'fairy_lights') {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) {
      const fx = z.x + ((i * 97 + Math.sin(timeSec * 0.8 + i) * 28) % z.w);
      const fy = z.y + ((i * 71 + Math.cos(timeSec * 0.7 + i) * 24) % z.h);
      const glow = 0.35 + Math.sin(timeSec * 3.4 + i) * 0.3;
      ctx.fillStyle = `rgba(253, 224, 71, ${glow})`;
      ctx.beginPath();
      ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (z.kind === 'elevator_glow') {
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.2 + Math.sin(timeSec * 3.2) * 0.08;
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    const g = ctx.createRadialGradient(cx, cy, 15, cx, cy, 145);
    g.addColorStop(0, `rgba(253, 224, 71, ${pulse})`);
    g.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 145, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawRoomBannerLabel(
  ctx: CanvasRenderingContext2D,
  lbl: RoomLabelZone,
  locale: Locale
) {
  ctx.save();
  ctx.font = '800 16px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  const txt = loc(lbl.title, locale);
  const tw = ctx.measureText(txt).width + 24;
  ctx.fillStyle = 'rgba(12, 8, 24, 0.72)';
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.68)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(lbl.x - tw / 2, lbl.y - 17, tw, 28, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fef3c7';
  ctx.fillText(txt, lbl.x, lbl.y + 2);
  ctx.restore();
}

export function drawAnimatedRpgCharacter(
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number;
    y: number;
    img?: HTMLImageElement;
    primaryColor: string;
    outfitColor: string;
    label: string;
    moving: boolean;
    walkPhase: number;
    facingX: number;
    inWater: boolean;
    isPlayer: boolean;
    timeSec: number;
  }
) {
  const {
    x,
    y,
    img,
    primaryColor,
    outfitColor,
    label,
    moving,
    walkPhase,
    facingX,
    inWater,
    isPlayer,
    timeSec,
  } = opts;

  const stride = moving ? Math.sin(walkPhase) : 0;
  const bounce = moving ? Math.abs(Math.sin(walkPhase)) * -6 : Math.sin(timeSec * 2.8 + x * 0.01) * 2.5;
  const lean = moving ? facingX * 0.07 : 0;

  ctx.save();
  ctx.translate(x, y);

  // 1. Ground Shadow OR Glowing Turquoise Swimming Ring!
  if (inWater) {
    const waveR = 32 + Math.sin(timeSec * 4.5) * 4;
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 14, waveR, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.46)';
    ctx.beginPath();
    ctx.ellipse(0, 38, 24 - Math.abs(bounce) * 0.6, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.rotate(lean);

  // 2. Animated Full-Figure RPG Body & Walking Legs (clipped below waist if swimming!)
  if (!inWater) {
    // Left & right animated legs/shoes
    const leftLegY = 24 + stride * 8;
    const rightLegY = 24 - stride * 8;
    ctx.lineCap = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = isPlayer ? '#1e293b' : '#fde68a';
    ctx.beginPath();
    ctx.moveTo(-8, 12 + bounce);
    ctx.lineTo(-9 + stride * 5, leftLegY);
    ctx.moveTo(8, 12 + bounce);
    ctx.lineTo(9 - stride * 5, rightLegY);
    ctx.stroke();
  }

  // Styled Torso / Gown / Suit
  ctx.fillStyle = outfitColor;
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (isPlayer) {
    ctx.roundRect(-16, -8 + bounce, 32, inWater ? 20 : 28, 9);
  } else {
    ctx.moveTo(-13, -8 + bounce);
    ctx.lineTo(13, -8 + bounce);
    ctx.lineTo(19, inWater ? 12 + bounce : 23 + bounce);
    ctx.lineTo(-19, inWater ? 12 + bounce : 23 + bounce);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();

  // Swinging Arms
  ctx.strokeStyle = outfitColor;
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.moveTo(-15, -3 + bounce);
  ctx.lineTo(-22 - stride * 5, 11 + bounce + stride * 4);
  ctx.moveTo(15, -3 + bounce);
  ctx.lineTo(22 + stride * 5, 11 + bounce - stride * 4);
  ctx.stroke();

  // 3. Crisp High-Res Portrait Head Crest
  const headY = -28 + bounce;
  const headR = isPlayer ? 27 : 26;

  // Bright halo behind character
  const halo = ctx.createRadialGradient(0, headY, 10, 0, headY, 44);
  halo.addColorStop(0, `${primaryColor}66`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, headY, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -headR, headY - headR, headR * 2, headR * 2);
  } else {
    ctx.fillStyle = primaryColor;
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.stroke();

  // Floating heart / sparkle above heroines
  if (!isPlayer) {
    const heartY = headY - 36 - ((timeSec * 18) % 16);
    const heartAlpha = 1 - ((timeSec * 18) % 16) / 16;
    ctx.font = '13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(251, 113, 133, ${heartAlpha})`;
    ctx.fillText('♥', 24, heartY);
  }

  // 4. Crisp High-Contrast Nameplate Pill
  ctx.font = '800 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  const nw = ctx.measureText(label).width + 16;
  const ny = headY - headR - 22;
  ctx.fillStyle = 'rgba(10, 6, 20, 0.84)';
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-nw / 2, ny, nw, 20, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 0, ny + 14);

  ctx.restore();
}

export function drawBrightMinimap(
  ctx: CanvasRenderingContext2D,
  floor: WorldFloorData,
  mapImg: HTMLImageElement | undefined,
  player: { x: number; y: number },
  girls: Array<{ x: number; y: number; color: string }>
) {
  const mw = 132;
  const mh = 82;
  const mx = 14;
  const my = 50; // safely below Android clock / top bar!
  const sx = mw / floor.width;
  const sy = mh / floor.height;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(mx, my, mw, mh, 10);
  ctx.save();
  ctx.clip();
  if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
    ctx.drawImage(mapImg, mx, my, mw, mh);
  } else {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(mx, my, mw, mh);
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (const g of girls) {
    ctx.fillStyle = g.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mx + g.x * sx, my + g.y * sy, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#38bdf8';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mx + player.x * sx, my + player.y * sy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
