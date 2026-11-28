import React, { useEffect, useRef } from 'react';
import { ZONES_25D, type Npc25D, type Sensor25D, type Zone25DId } from '../data/world25dZones';
import type { HeroineId, Locale } from '../types/game';

interface World25DCanvasProps {
  zoneId: Zone25DId;
  locale: Locale;
  zoomClose: boolean;
  sprinting: boolean;
  drivingCar: boolean;
  companionId: HeroineId | null;
  joyVecRef: React.MutableRefObject<{ x: number; y: number }>;
  onNearSensor: (s: Sensor25D | null) => void;
  onNearNpc: (n: Npc25D | null) => void;
  onAutoActivateSensor: (s: Sensor25D) => void;
  onAutoActivateNpc: (n: Npc25D) => void;
}

interface Ripple {
  nx: number;
  ny: number;
  age: number;
  color: string;
}

export const World25DCanvas: React.FC<World25DCanvasProps> = ({
  zoneId,
  locale,
  zoomClose,
  sprinting,
  drivingCar,
  companionId,
  joyVecRef,
  onNearSensor,
  onNearNpc,
  onAutoActivateSensor,
  onAutoActivateNpc,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const liveRef = useRef({
    locale,
    zoomClose,
    sprinting,
    drivingCar,
    companionId,
    onNearSensor,
    onNearNpc,
    onAutoActivateSensor,
    onAutoActivateNpc,
  });
  liveRef.current = {
    locale,
    zoomClose,
    sprinting,
    drivingCar,
    companionId,
    onNearSensor,
    onNearNpc,
    onAutoActivateSensor,
    onAutoActivateNpc,
  };

  useEffect(() => {
    const urls = [
      '/assets/world_city_map.jpg',
      '/assets/world_1f_map.jpg',
      '/assets/world_8f_map.jpg',
      '/assets/world_12f_map.jpg',
      '/assets/world_17f_map.jpg',
      '/assets/world_18f_map.jpg',
      '/assets/sprite_sipan.png',
      '/assets/sprite_layla.png',
      '/assets/sprite_celine.png',
      '/assets/sprite_aria.png',
      '/assets/sprite_nara.png',
      '/assets/sprite_shadow.png',
      '/assets/sprite_supercar.png',
    ];
    for (const u of urls) {
      if (!imgCacheRef.current[u]) {
        const im = new Image();
        im.src = u;
        imgCacheRef.current[u] = im;
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const zone = ZONES_25D[zoneId];
    const player = {
      nx: zone.spawn.nx,
      ny: zone.spawn.ny,
      facing: 1,
      walkPhase: 0,
    };
    const carPos = { nx: 41, ny: 67, facing: 1 };
    const cam = { nx: zone.spawn.nx, ny: zone.spawn.ny };
    let walkGoal: {
      nx: number;
      ny: number;
      pendingSensor?: Sensor25D;
      pendingNpc?: Npc25D;
    } | null = null;

    const npcRuntime = zone.npcs.map((n, i) => ({
      data: n,
      nx: n.nx,
      ny: n.ny,
      facing: 1,
      walkPhase: i * 1.7,
      offset: i * 2.3,
    }));

    // Ambient floating fireflies / cherry-gold motes
    const motes = Array.from({ length: 22 }, (_, i) => ({
      nx: (i * 19 + 7) % 100,
      ny: (i * 29 + 13) % 100,
      r: 1.5 + (i % 3),
      sp: 1.2 + (i % 4) * 0.4,
      ph: i * 0.9,
    }));
    const ripples: Ripple[] = [];

    const keys: Record<string, boolean> = {};
    const down = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    // Compute rendered map rect inside canvas
    const getMapTransform = (cw: number, ch: number, mapImg?: HTMLImageElement) => {
      const aspect = mapImg && mapImg.naturalWidth ? mapImg.naturalWidth / mapImg.naturalHeight : 1.6;
      const zoom = liveRef.current.zoomClose ? 1.58 : 1.04;
      let mw = cw * zoom;
      let mh = mw / aspect;
      if (mh < ch * zoom) {
        mh = ch * zoom;
        mw = mh * aspect;
      }
      let ox = cw / 2 - (cam.nx / 100) * mw;
      let oy = ch / 2 - (cam.ny / 100) * mh;
      ox = Math.min(0, Math.max(cw - mw, ox));
      oy = Math.min(0, Math.max(ch - mh, oy));
      return { ox, oy, mw, mh };
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const mapImg = imgCacheRef.current[zone.mapUrl];
      const { ox, oy, mw, mh } = getMapTransform(rect.width, rect.height, mapImg);
      const clickNx = Math.max(5, Math.min(95, ((sx - ox) / mw) * 100));
      const clickNy = Math.max(10, Math.min(94, ((sy - oy) / mh) * 100));

      // Check if user tapped directly on an NPC or Sensor!
      let hitNpc: Npc25D | undefined;
      for (const nr of npcRuntime) {
        if (Math.hypot(clickNx - nr.nx, clickNy - (nr.ny - 4)) < 6.5) {
          hitNpc = nr.data;
          break;
        }
      }
      let hitSensor: Sensor25D | undefined;
      if (!hitNpc) {
        for (const s of zone.sensors) {
          if (Math.hypot(clickNx - s.nx, clickNy - s.ny) < 6.5) {
            hitSensor = s;
            break;
          }
        }
      }

      ripples.push({ nx: clickNx, ny: clickNy, age: 0, color: hitNpc ? '#f472b6' : '#fbbf24' });
      walkGoal = {
        nx: hitNpc ? clickNx : hitSensor ? hitSensor.nx : clickNx,
        ny: hitNpc ? clickNy + 2 : hitSensor ? hitSensor.ny : clickNy,
        pendingNpc: hitNpc,
        pendingSensor: hitSensor,
      };
    };
    canvas.addEventListener('pointerdown', onPointerDown);

    let raf = 0;
    let prev = performance.now();
    let waterTimer = 0;

    const inWaterAt = (nx: number, ny: number) => {
      if (!zone.waterZones) return false;
      return zone.waterZones.some((w) => nx >= w.minX && nx <= w.maxX && ny >= w.minY && ny <= w.maxY);
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const t = now * 0.001;
      const { locale: locNow, sprinting: sp, drivingCar: dc, companionId: comp } = liveRef.current;
      const isKu = locNow === 'ckb';

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Player movement
      let ix = joyVecRef.current.x;
      let iy = joyVecRef.current.y;
      if (keys['w'] || keys['arrowup']) iy -= 1;
      if (keys['s'] || keys['arrowdown']) iy += 1;
      if (keys['a'] || keys['arrowleft']) ix -= 1;
      if (keys['d'] || keys['arrowright']) ix += 1;

      if (Math.hypot(ix, iy) > 0.08) {
        walkGoal = null;
      } else if (walkGoal) {
        const dx = walkGoal.nx - player.nx;
        const dy = walkGoal.ny - player.ny;
        const dist = Math.hypot(dx, dy);
        if (dist < 1.4) {
          const doneSensor = walkGoal.pendingSensor;
          const doneNpc = walkGoal.pendingNpc;
          walkGoal = null;
          if (doneNpc) liveRef.current.onAutoActivateNpc(doneNpc);
          else if (doneSensor) liveRef.current.onAutoActivateSensor(doneSensor);
        } else {
          ix = dx / dist;
          iy = dy / dist;
        }
      }

      const speedPct = dc && zoneId === 'city' ? 42 : sp ? 28 : 18;
      let moving = false;
      if (Math.hypot(ix, iy) > 0.05) {
        const len = Math.max(1, Math.hypot(ix, iy));
        const vx = (ix / len) * speedPct * dt;
        const vy = (iy / len) * speedPct * dt;
        player.nx = Math.max(5, Math.min(95, player.nx + vx));
        player.ny = Math.max(11, Math.min(93, player.ny + vy));
        if (Math.abs(ix) > 0.06) player.facing = ix >= 0 ? 1 : -1;
        player.walkPhase += dt * (sp ? 15 : 10);
        moving = true;
        if (dc && zoneId === 'city') {
          carPos.nx = player.nx;
          carPos.ny = player.ny;
          carPos.facing = player.facing;
        }
      }

      const playerSwim = inWaterAt(player.nx, player.ny);
      waterTimer += dt;
      if (moving && playerSwim && waterTimer > 0.25) {
        waterTimer = 0;
        ripples.push({ nx: player.nx, ny: player.ny, age: 0, color: '#38bdf8' });
      }

      // Smooth 2.5D camera follow
      cam.nx += (player.nx - cam.nx) * 0.12;
      cam.ny += (player.ny - cam.ny) * 0.12;

      const mapImg = imgCacheRef.current[zone.mapUrl];
      const { ox, oy, mw, mh } = getMapTransform(cw, ch, mapImg);

      // Draw crisp 2.5D hand-painted background
      ctx.fillStyle = '#090d1a';
      ctx.fillRect(0, 0, cw, ch);
      if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
        ctx.drawImage(mapImg, ox, oy, mw, mh);
      }

      // Draw subtle glowing 2.5D floor rings on interactive spots
      let nearSen: Sensor25D | null = null;
      let bestSenD = Infinity;
      for (const s of zone.sensors) {
        if (s.kind === 'supercar' && dc) continue;
        const d = Math.hypot(player.nx - s.nx, player.ny - s.ny);
        if (d < s.radius && d < bestSenD) {
          bestSenD = d;
          nearSen = s;
        }
        const sx = ox + (s.nx / 100) * mw;
        const sy = oy + (s.ny / 100) * mh;
        const pulse = 1 + Math.sin(t * 3.2 + s.nx) * 0.12;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(1, 0.52);
        ctx.beginPath();
        ctx.arc(0, 0, 20 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = d < s.radius ? '#fde047' : 'rgba(251, 191, 36, 0.72)';
        ctx.lineWidth = d < s.radius ? 3.2 : 2;
        ctx.stroke();
        ctx.fillStyle = d < s.radius ? 'rgba(250, 204, 21, 0.28)' : 'rgba(15, 23, 42, 0.35)';
        ctx.fill();
        ctx.restore();
      }

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.age += dt;
        if (rp.age > 0.75) {
          ripples.splice(i, 1);
          continue;
        }
        const rx = ox + (rp.nx / 100) * mw;
        const ry = oy + (rp.ny / 100) * mh;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.scale(1, 0.52);
        ctx.beginPath();
        ctx.arc(0, 0, 8 + rp.age * 38, 0, Math.PI * 2);
        ctx.strokeStyle = rp.color;
        ctx.globalAlpha = Math.max(0, 1 - rp.age / 0.75);
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();
      }

      // Update NPCs + Companion Hand-Holding Follow
      let nearN: Npc25D | null = null;
      let bestNpcD = 8.5;
      for (const nr of npcRuntime) {
        const isComp = comp && nr.data.id === comp;
        let tx = nr.data.nx;
        let ty = nr.data.ny;
        if (isComp) {
          tx = player.nx - player.facing * 4.2;
          ty = player.ny + 1.2;
        } else {
          const w = (Math.sin(t * 0.45 + nr.offset) + 1) * 0.5;
          tx = nr.data.nx + (nr.data.patrolNx - nr.data.nx) * w;
          ty = nr.data.ny + (nr.data.patrolNy - nr.data.ny) * w;
        }
        const dx = tx - nr.nx;
        const dy = ty - nr.ny;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.25) {
          const step = Math.min(dist, (isComp ? 22 : 5.5) * dt);
          nr.nx += (dx / dist) * step;
          nr.ny += (dy / dist) * step;
          if (Math.abs(dx) > 0.05) nr.facing = dx >= 0 ? 1 : -1;
          nr.walkPhase += dt * (isComp ? 10 : 5.5);
        }
        const dp = Math.hypot(nr.nx - player.nx, nr.ny - player.ny);
        if (dp < bestNpcD && !isComp) {
          bestNpcD = dp;
          nearN = nr.data;
        }
      }

      // Build Y-Sorted 2.5D Render List (Characters + Supercar)
      type Drawable = { ny: number; draw: () => void };
      const drawables: Drawable[] = [];

      const pushSpriteEntity = (
        spriteUrl: string,
        nx: number,
        ny: number,
        facing: number,
        walkP: number,
        isMoving: boolean,
        aura: string,
        nameTag: string | null
      ) => {
        drawables.push({
          ny,
          draw: () => {
            const img = imgCacheRef.current[spriteUrl];
            if (!img || !img.complete || !img.naturalWidth) return;
            const px = ox + (nx / 100) * mw;
            const py = oy + (ny / 100) * mh;
            const depthRatio = zone.baseScale + (ny / 100) * zone.perspectiveScale;
            const sh = mh * depthRatio;
            const sw = sh * (img.naturalWidth / img.naturalHeight);
            const swim = inWaterAt(nx, ny);
            const bounce = isMoving ? Math.abs(Math.sin(walkP)) * 6 : Math.sin(t * 2.5 + walkP) * 1.8;

            // Ground shadow + 2.5D aura ellipse
            ctx.save();
            ctx.translate(px, py);
            ctx.scale(1, 0.46);
            ctx.beginPath();
            ctx.arc(0, 0, sw * 0.36, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(2, 6, 23, 0.48)';
            ctx.fill();
            ctx.strokeStyle = aura;
            ctx.lineWidth = 2.4;
            ctx.stroke();
            ctx.restore();

            ctx.save();
            if (swim) {
              // Waist-deep water clip!
              ctx.beginPath();
              ctx.rect(px - sw, py - sh * 1.2, sw * 2, sh * 0.86);
              ctx.clip();
            }
            ctx.translate(px, py - bounce + (swim ? sh * 0.26 : 0));
            ctx.scale(facing, 1);
            ctx.drawImage(img, -sw / 2, -sh, sw, sh);
            ctx.restore();

            if (nameTag) {
              ctx.font = '700 11px system-ui, sans-serif';
              const tw = ctx.measureText(nameTag).width + 14;
              const bx = px - tw / 2;
              const by = py - sh - 22 - bounce + (swim ? sh * 0.26 : 0);
              ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
              ctx.strokeStyle = aura;
              ctx.lineWidth = 1.3;
              ctx.beginPath();
              ctx.roundRect(bx, by, tw, 19, 9);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#fffbeb';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(nameTag, px, by + 9.5);
            }
          },
        });
      };

      if (zoneId === 'city') {
        drawables.push({
          ny: carPos.ny,
          draw: () => {
            const cImg = imgCacheRef.current['/assets/sprite_supercar.png'];
            if (!cImg || !cImg.complete || !cImg.naturalWidth) return;
            const px = ox + (carPos.nx / 100) * mw;
            const py = oy + (carPos.ny / 100) * mh;
            const cwCar = mw * 0.13;
            const chCar = cwCar * (cImg.naturalHeight / cImg.naturalWidth);
            ctx.save();
            ctx.translate(px, py);
            ctx.scale(-carPos.facing, 1);
            ctx.drawImage(cImg, -cwCar / 2, -chCar * 0.78, cwCar, chCar);
            ctx.restore();
          },
        });
      }

      if (!(dc && zoneId === 'city')) {
        pushSpriteEntity(
          '/assets/sprite_sipan.png',
          player.nx,
          player.ny,
          player.facing,
          player.walkPhase,
          moving,
          '#38bdf8',
          isKu ? 'سیپان' : 'Sipan'
        );
      }

      for (const nr of npcRuntime) {
        if (dc && zoneId === 'city' && comp === nr.data.id) continue;
        const movingNpc = Math.hypot(nr.nx - nr.data.nx, nr.ny - nr.data.ny) > 0.2;
        pushSpriteEntity(
          nr.data.sprite,
          nr.nx,
          nr.ny,
          nr.facing,
          nr.walkPhase,
          movingNpc,
          nr.data.aura,
          isKu ? nr.data.nameKu : nr.data.nameEn
        );
      }

      drawables.sort((a, b) => a.ny - b.ny);
      for (const d of drawables) d.draw();

      // Compact Icon Pills on Sensors (Clean, zero clutter!)
      for (const s of zone.sensors) {
        if (s.kind === 'supercar' && dc) continue;
        const sx = ox + (s.nx / 100) * mw;
        const sy = oy + (s.ny / 100) * mh - 18 + Math.sin(t * 3 + s.nx) * 3;
        const isNear = nearSen?.id === s.id;
        const txt = isNear ? `${s.icon} ${isKu ? s.labelKu : s.labelEn}` : s.icon;
        ctx.font = isNear ? '800 11.5px system-ui, sans-serif' : '15px system-ui, sans-serif';
        const wPill = isNear ? ctx.measureText(txt).width + 18 : 30;
        const hPill = isNear ? 24 : 28;
        ctx.fillStyle = isNear ? 'rgba(245, 158, 11, 0.95)' : 'rgba(15, 23, 42, 0.82)';
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(sx - wPill / 2, sy - hPill / 2, wPill, hPill, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isNear ? '#0f172a' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, sx, sy + 0.5);
      }

      // Ambient warm 2.5D floating light motes
      for (const m of motes) {
        const mx = ox + (((m.nx + Math.sin(t * 0.4 + m.ph) * 3 + 100) % 100) / 100) * mw;
        const my = oy + (((m.ny - t * m.sp + 200) % 100) / 100) * mh;
        ctx.beginPath();
        ctx.arc(mx, my, m.r, 0, Math.PI * 2);
        ctx.fillStyle = zone.ambientColor;
        ctx.globalAlpha = 0.35 + Math.sin(t * 2 + m.ph) * 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      liveRef.current.onNearSensor(nearSen);
      liveRef.current.onNearNpc(nearN);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [zoneId]);

  return <canvas ref={canvasRef} className="w-full h-full block touch-none select-none cursor-pointer" />;
};
