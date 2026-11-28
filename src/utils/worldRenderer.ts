import { FloorMapData, RoomZone, WorldProp } from '../data/worldFloors';
import { Locale } from '../types/game';

export interface SteamParticle {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
}

export interface RippleRing {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

export function drawRoomFloor(
  ctx: CanvasRenderingContext2D,
  room: RoomZone,
  timeSec: number,
  locale: Locale
) {
  ctx.save();
  ctx.fillStyle = room.tint;
  ctx.fillRect(room.x, room.y, room.w, room.h);

  if (room.floorType === 'wood' || room.floorType === 'deck') {
    ctx.strokeStyle = 'rgba(255, 215, 160, 0.06)';
    ctx.lineWidth = 1;
    const step = room.floorType === 'deck' ? 28 : 36;
    for (let y = room.y; y < room.y + room.h; y += step) {
      ctx.beginPath();
      ctx.moveTo(room.x, y);
      ctx.lineTo(room.x + room.w, y);
      ctx.stroke();
    }
  } else if (room.floorType === 'marble') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let x = room.x; x < room.x + room.w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, room.y);
      ctx.lineTo(x, room.y + room.h);
      ctx.stroke();
    }
    for (let y = room.y; y < room.y + room.h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(room.x, y);
      ctx.lineTo(room.x + room.w, y);
      ctx.stroke();
    }
  } else if (room.floorType === 'carpet') {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(room.x + 12, room.y + 12, room.w - 24, room.h - 24);
  } else if (room.floorType === 'water') {
    const grad = ctx.createLinearGradient(room.x, room.y, room.x, room.y + room.h);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(room.x, room.y, room.w, room.h);

    // Animated caustic waves
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.26)';
    ctx.lineWidth = 2;
    for (let wy = room.y + 32; wy < room.y + room.h - 20; wy += 48) {
      ctx.beginPath();
      for (let wx = room.x + 16; wx < room.x + room.w - 16; wx += 24) {
        const dy = Math.sin(wx * 0.025 + timeSec * 2.4 + wy * 0.04) * 5;
        if (wx === room.x + 16) ctx.moveTo(wx, wy + dy);
        else ctx.lineTo(wx, wy + dy);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 3;
    ctx.strokeRect(room.x, room.y, room.w, room.h);
  }

  // Subtle floor room title watermark (Estella style: crisp text on floor, no heavy box)
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 245, 230, 0.34)';
  ctx.textAlign = 'center';
  ctx.fillText(room.title[locale], room.x + room.w / 2, room.y + room.h - 18);
  ctx.restore();
}

export function drawWorldProp(
  ctx: CanvasRenderingContext2D,
  prop: WorldProp,
  timeSec: number,
  locale: Locale
) {
  ctx.save();
  // Soft drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.roundRect(prop.x + 6, prop.y + 8, prop.w, prop.h, 14);
  ctx.fill();

  if (prop.kind === 'jacuzzi') {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(prop.x, prop.y, prop.w, prop.h, 28);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(prop.x + 14, prop.y + 14, prop.w - 28, prop.h - 28, 22);
    ctx.fill();
    // Foam bubbles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    for (let i = 0; i < 9; i++) {
      const bx = prop.x + 34 + ((i * 37) % (prop.w - 68));
      const by = prop.y + 34 + ((i * 53) % (prop.h - 68));
      const br = 11 + Math.sin(timeSec * 2 + i) * 3;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (prop.kind === 'elevator') {
    const pulse = 0.55 + Math.sin(timeSec * 3.2) * 0.25;
    ctx.fillStyle = `rgba(251, 191, 36, ${pulse * 0.25})`;
    ctx.beginPath();
    ctx.roundRect(prop.x, prop.y, prop.w, prop.h, 18);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (prop.kind === 'fireplace') {
    ctx.fillStyle = '#44403c';
    ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
    const glow = ctx.createRadialGradient(
      prop.x + prop.w / 2,
      prop.y + prop.h,
      8,
      prop.x + prop.w / 2,
      prop.y + prop.h + 40,
      150
    );
    glow.addColorStop(0, `rgba(251, 146, 60, ${0.48 + Math.sin(timeSec * 7) * 0.12})`);
    glow.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(prop.x + prop.w / 2, prop.y + prop.h, 150, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = prop.color;
    ctx.beginPath();
    ctx.roundRect(prop.x, prop.y, prop.w, prop.h, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (prop.kind === 'bed') {
      // Pillows
      ctx.fillStyle = 'rgba(255, 240, 245, 0.85)';
      ctx.beginPath();
      ctx.roundRect(prop.x + 18, prop.y + 14, 68, 34, 8);
      ctx.roundRect(prop.x + prop.w - 86, prop.y + 14, 68, 34, 8);
      ctx.fill();
    }
  }

  if (prop.label) {
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'center';
    ctx.fillText(prop.label[locale], prop.x + prop.w / 2, prop.y + prop.h / 2 + 4);
  }
  ctx.restore();
}

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  floor: FloorMapData,
  playerPos: { x: number; y: number },
  girlPositions: Array<{ x: number; y: number; color: string }>
) {
  const mw = 116;
  const mh = 82;
  const mx = 14;
  const my = 14;
  const sx = mw / floor.width;
  const sy = mh / floor.height;

  ctx.save();
  ctx.fillStyle = 'rgba(8, 6, 16, 0.72)';
  ctx.beginPath();
  ctx.roundRect(mx, my, mw, mh, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(231, 194, 125, 0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  for (const r of floor.rooms) {
    ctx.fillStyle = r.floorType === 'water' ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(mx + r.x * sx, my + r.y * sy, r.w * sx, r.h * sy);
  }

  for (const g of girlPositions) {
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(mx + g.x * sx, my + g.y * sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.arc(mx + playerPos.x * sx, my + playerPos.y * sy, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}
