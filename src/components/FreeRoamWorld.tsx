import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HEROINES, loc, MOOD_META } from '../data/catalog';
import { HEROINE_OUTFITS, SIPAN_OUTFITS } from '../data/outfits';
import { TOWER_HOTSPOTS, TowerHotspot } from '../data/towerMap';
import { FloorId, RectBox, WORLD_FLOORS, WorldSensor } from '../data/worldFloors';
import { GameState, HeroineId, Locale, LocationId } from '../types/game';
import {
  drawMinimap,
  drawRoomFloor,
  drawWorldProp,
  RippleRing,
  SteamParticle,
} from '../utils/worldRenderer';

interface FreeRoamWorldProps {
  state: GameState;
  locale: Locale;
  sipanOutfit: string;
  equippedOutfits: Record<HeroineId, string>;
  hasStoryReady: (hid: HeroineId) => boolean;
  onEngageHeroine: (hid: HeroineId, locId: LocationId) => void;
  onTriggerSecret: (spot: TowerHotspot) => void;
  onTriggerSpa: (spot: TowerHotspot) => void;
  onOpenShop: () => void;
  onStartMixology: () => void;
}

function circleHitsRect(cx: number, cy: number, r: number, b: RectBox): boolean {
  const nx = Math.max(b.x, Math.min(cx, b.x + b.w));
  const ny = Math.max(b.y, Math.min(cy, b.y + b.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export const FreeRoamWorld: React.FC<FreeRoamWorldProps> = ({
  state,
  locale,
  sipanOutfit,
  equippedOutfits,
  hasStoryReady,
  onEngageHeroine,
  onTriggerSecret,
  onTriggerSpa,
  onOpenShop,
  onStartMixology,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [floorId, setFloorId] = useState<FloorId>('17f');
  const [nearHeroine, setNearHeroine] = useState<HeroineId | null>(null);
  const [nearSensor, setNearSensor] = useState<WorldSensor | null>(null);
  const [joyVec, setJoyVec] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const playerRef = useRef({ x: 1000, y: 700, vx: 0, vy: 0, walkPhase: 0 });
  const camRef = useRef({ x: 1000, y: 700 });
  const targetWalkRef = useRef<{ x: number; y: number } | null>(null);
  const joyRef = useRef({ x: 0, y: 0, active: false, originX: 0, originY: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const imagesCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const ripplesRef = useRef<RippleRing[]>([]);
  const steamRef = useRef<SteamParticle[]>([]);

  // Preload character circular portraits
  useEffect(() => {
    const urls = [
      ...SIPAN_OUTFITS.map((s) => s.image),
      ...HEROINE_OUTFITS.layla.map((o) => o.image),
      ...HEROINE_OUTFITS.celine.map((o) => o.image),
      ...HEROINE_OUTFITS.aria.map((o) => o.image),
    ];
    urls.forEach((u) => {
      if (!imagesCacheRef.current[u]) {
        const img = new Image();
        img.src = u;
        imagesCacheRef.current[u] = img;
      }
    });
  }, []);

  // Keyboard support
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const switchFloor = (nextFloor: FloorId, spawn?: { x: number; y: number }) => {
    const f = WORLD_FLOORS[nextFloor];
    const pt = spawn || f.defaultSpawn;
    playerRef.current.x = pt.x;
    playerRef.current.y = pt.y;
    camRef.current.x = pt.x;
    camRef.current.y = pt.y;
    targetWalkRef.current = null;
    setFloorId(nextFloor);
  };

  // Main 60fps Estella-style Game Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    // Seed steam particles around baths & jacuzzis
    steamRef.current = Array.from({ length: 26 }, (_, i) => ({
      x: (i * 173) % 1900,
      y: (i * 97) % 600,
      r: 16 + (i % 14),
      vy: 14 + (i % 12),
      alpha: 0.16 + (i % 4) * 0.05,
    }));

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const timeSec = now / 1000;
      const canvas = canvasRef.current;
      if (!canvas) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (canvas.width !== Math.floor(cw * dpr) || canvas.height !== Math.floor(ch * dpr)) {
        canvas.width = Math.floor(cw * dpr);
        canvas.height = Math.floor(ch * dpr);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const floor = WORLD_FLOORS[floorId];
      const p = playerRef.current;
      const speed = 295;
      const radius = 26;

      // 1. Read Input (Joystick -> Keys -> Tap-to-walk)
      let ix = joyRef.current.x;
      let iy = joyRef.current.y;

      if (Math.hypot(ix, iy) < 0.08) {
        if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) iy -= 1;
        if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) iy += 1;
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) ix -= 1;
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) ix += 1;
        const kl = Math.hypot(ix, iy);
        if (kl > 1) {
          ix /= kl;
          iy /= kl;
        }
      }

      if (Math.hypot(ix, iy) > 0.08) {
        targetWalkRef.current = null;
      } else if (targetWalkRef.current) {
        const dx = targetWalkRef.current.x - p.x;
        const dy = targetWalkRef.current.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 12) {
          targetWalkRef.current = null;
        } else {
          ix = dx / dist;
          iy = dy / dist;
        }
      }

      // 2. Kinematic Swept Move + Wall Slide
      const colliders: RectBox[] = [
        ...floor.walls,
        ...floor.props.filter((pr) => pr.solid),
      ];

      const tryX = p.x + ix * speed * dt;
      if (!colliders.some((b) => circleHitsRect(tryX, p.y, radius, b))) {
        p.x = tryX;
      }
      const tryY = p.y + iy * speed * dt;
      if (!colliders.some((b) => circleHitsRect(p.x, tryY, radius, b))) {
        p.y = tryY;
      }

      const moving = Math.hypot(ix, iy) > 0.05;
      if (moving) {
        p.walkPhase += dt * 11;
        // Water ripple check
        const inWater = floor.rooms.some(
          (r) =>
            r.floorType === 'water' &&
            p.x > r.x &&
            p.x < r.x + r.w &&
            p.y > r.y &&
            p.y < r.y + r.h
        );
        if (inWater && Math.random() < 0.28) {
          ripplesRef.current.push({ x: p.x, y: p.y + 10, r: 10, alpha: 0.65 });
        }
      }

      // 3. Estella camera:follow-2d with Dead-Zone & CameraBounds
      const cam = camRef.current;
      const dzX = 36;
      const dzY = 36;
      let desiredX = cam.x;
      let desiredY = cam.y;
      if (p.x - cam.x > dzX) desiredX = p.x - dzX;
      else if (cam.x - p.x > dzX) desiredX = p.x + dzX;
      if (p.y - cam.y > dzY) desiredY = p.y - dzY;
      else if (cam.y - p.y > dzY) desiredY = p.y + dzY;

      cam.x += (desiredX - cam.x) * Math.min(1, dt * 8.5);
      cam.y += (desiredY - cam.y) * Math.min(1, dt * 8.5);

      const halfW = cw / 2;
      const halfH = ch / 2;
      const clampedCamX =
        floor.width > cw
          ? Math.max(halfW, Math.min(floor.width - halfW, cam.x))
          : floor.width / 2;
      const clampedCamY =
        floor.height > ch
          ? Math.max(halfH, Math.min(floor.height - halfH, cam.y))
          : floor.height / 2;

      // 4. Check Proximity Sensors & Heroines
      let foundHeroine: HeroineId | null = null;
      const activeGirls: Array<{ id: HeroineId; x: number; y: number; color: string }> = [];

      (['layla', 'celine', 'aria'] as HeroineId[]).forEach((hid) => {
        const baseSpot = floor.heroineSpots[hid];
        if (baseSpot.floor === floorId) {
          const gx = baseSpot.x + Math.sin(timeSec * 1.1 + hid.length) * 14;
          const gy = baseSpot.y + Math.cos(timeSec * 0.9 + hid.length) * 10;
          activeGirls.push({ id: hid, x: gx, y: gy, color: HEROINES[hid].color });
          if (Math.hypot(p.x - gx, p.y - gy) < 125) {
            foundHeroine = hid;
          }
        }
      });

      let foundSensor: WorldSensor | null = null;
      let bestDist = 9999;
      for (const s of floor.sensors) {
        const d = Math.hypot(p.x - s.x, p.y - s.y);
        if (d < s.radius && d < bestDist) {
          bestDist = d;
          foundSensor = s;
        }
      }

      setNearHeroine((prev) => (prev === foundHeroine ? prev : foundHeroine));
      setNearSensor((prev) => (prev?.id === foundSensor?.id ? prev : foundSensor));

      // 5. Render World
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#090612';
      ctx.fillRect(0, 0, cw, ch);

      // Starfield perimeter for rooftop
      if (floorId === '18f') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        for (let i = 0; i < 36; i++) {
          const sx = ((i * 97) % cw);
          const sy = ((i * 61) % ch);
          ctx.fillRect(sx, sy, 2, 2);
        }
      }

      ctx.save();
      ctx.translate(cw / 2 - clampedCamX, ch / 2 - clampedCamY);

      // Rooms
      for (const room of floor.rooms) {
        drawRoomFloor(ctx, room, timeSec, locale);
      }

      // Props
      for (const prop of floor.props) {
        drawWorldProp(ctx, prop, timeSec, locale);
      }

      // Walls (sleek architectural gold-trimmed dark walls)
      ctx.fillStyle = '#140c1f';
      ctx.strokeStyle = 'rgba(231, 194, 125, 0.36)';
      ctx.lineWidth = 2;
      for (const w of floor.walls) {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      }

      // Sensor floor rings (subtle pulsing rings, NO overlapping text boxes!)
      for (const s of floor.sensors) {
        const pulse = 0.4 + Math.sin(timeSec * 3.5 + s.x) * 0.2;
        ctx.save();
        ctx.strokeStyle = `rgba(251, 191, 36, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 26 + Math.sin(timeSec * 3) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = '18px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(s.icon, s.x, s.y + 6);
        ctx.restore();
      }

      // Tap-to-walk target ring
      if (targetWalkRef.current) {
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(
          targetWalkRef.current.x,
          targetWalkRef.current.y,
          14 + Math.sin(timeSec * 8) * 4,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      // Water Ripples
      ripplesRef.current = ripplesRef.current.filter((rp) => rp.alpha > 0.03);
      for (const rp of ripplesRef.current) {
        rp.r += dt * 42;
        rp.alpha -= dt * 0.9;
        ctx.strokeStyle = `rgba(186, 230, 253, ${rp.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rising Steam Clouds over Jacuzzis/Baths
      for (const pr of floor.props.filter((x) => x.kind === 'jacuzzi')) {
        for (let i = 0; i < 4; i++) {
          const sx = pr.x + 40 + ((i * 43 + timeSec * 12) % (pr.w - 60));
          const sy = pr.y + pr.h - ((timeSec * 28 + i * 45) % (pr.h + 30));
          ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
          ctx.beginPath();
          ctx.arc(sx, sy, 22 + (i % 3) * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Heroines (Living breathing tokens + crisp Estella nameplate)
      for (const g of activeGirls) {
        const eqId = equippedOutfits[g.id];
        const imgUrl =
          HEROINE_OUTFITS[g.id].find((o) => o.id === eqId)?.image ||
          HEROINES[g.id].avatar;
        const imgEl = imagesCacheRef.current[imgUrl];
        const bob = Math.sin(timeSec * 2.6 + g.x) * 3;

        // Romantic aura
        const aura = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, 56);
        aura.addColorStop(0, `${g.color}55`);
        aura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 56, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(g.x, g.y + bob, 29, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
          ctx.drawImage(imgEl, g.x - 29, g.y + bob - 29, 58, 58);
        } else {
          ctx.fillStyle = g.color;
          ctx.fill();
        }
        ctx.restore();

        ctx.strokeStyle = g.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(g.x, g.y + bob, 29, 0, Math.PI * 2);
        ctx.stroke();

        // Crisp unboxed nameplate (Estella Screen-UI rule!)
        ctx.save();
        ctx.font = '700 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#fff';
        const storyStar = hasStoryReady(g.id) ? ' ★' : '';
        ctx.fillText(
          `${MOOD_META[state.heroines[g.id].mood].icon} ${HEROINES[g.id].name[locale]}${storyStar}`,
          g.x,
          g.y + bob - 38
        );
        ctx.restore();
      }

      // Draw Playable Sipan (سیپان) with warm lantern aura & walk bob!
      const sipanWalkBob = moving ? Math.abs(Math.sin(p.walkPhase)) * -5 : Math.sin(timeSec * 2.2) * 2;
      const sipanImgUrl =
        SIPAN_OUTFITS.find((s) => s.id === sipanOutfit)?.image ||
        '/assets/sipan_penthouse.jpg';
      const sipanImg = imagesCacheRef.current[sipanImgUrl];

      const pGlow = ctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, 85);
      pGlow.addColorStop(0, 'rgba(96, 165, 250, 0.36)');
      pGlow.addColorStop(1, 'rgba(96, 165, 250, 0)');
      ctx.fillStyle = pGlow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 85, 0, Math.PI * 2);
      ctx.fill();

      // Shadow under feet
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 28, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y + sipanWalkBob, 31, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if (sipanImg && sipanImg.complete && sipanImg.naturalWidth > 0) {
        ctx.drawImage(sipanImg, p.x - 31, p.y + sipanWalkBob - 31, 62, 62);
      } else {
        ctx.fillStyle = '#2563eb';
        ctx.fill();
      }
      ctx.restore();

      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y + sipanWalkBob, 31, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.font = '800 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#bfdbfe';
      ctx.fillText(locale === 'ckb' ? '👑 سیپان' : '👑 Sipan', p.x, p.y + sipanWalkBob - 39);
      ctx.restore();

      ctx.restore(); // end world camera

      // Draw Corner Minimap Radar
      drawMinimap(
        ctx,
        floor,
        p,
        activeGirls.map((g) => ({ x: g.x, y: g.y, color: g.color }))
      );

      ctx.restore();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [equippedOutfits, floorId, hasStoryReady, locale, sipanOutfit, state.heroines]);

  // Tap on Canvas to walk directly to any room/spot
  const handleCanvasTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Ignore taps on minimap top-left
    if (sx < 136 && sy < 102) return;

    const floor = WORLD_FLOORS[floorId];
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    const clampedCamX =
      floor.width > rect.width
        ? Math.max(halfW, Math.min(floor.width - halfW, camRef.current.x))
        : floor.width / 2;
    const clampedCamY =
      floor.height > rect.height
        ? Math.max(halfH, Math.min(floor.height - halfH, camRef.current.y))
        : floor.height / 2;

    const wx = sx - rect.width / 2 + clampedCamX;
    const wy = sy - rect.height / 2 + clampedCamY;
    targetWalkRef.current = {
      x: Math.max(95, Math.min(floor.width - 95, wx)),
      y: Math.max(95, Math.min(floor.height - 95, wy)),
    };
  };

  // Virtual Analog Joystick Handlers
  const handleJoyStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    joyRef.current = {
      active: true,
      originX: rect.left + rect.width / 2,
      originY: rect.top + rect.height / 2,
      x: 0,
      y: 0,
    };
  };

  const handleJoyMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!joyRef.current.active) return;
    const dx = e.clientX - joyRef.current.originX;
    const dy = e.clientY - joyRef.current.originY;
    const maxR = 42;
    const dist = Math.hypot(dx, dy);
    const nx = dist > maxR ? (dx / dist) * maxR : dx;
    const ny = dist > maxR ? (dy / dist) * maxR : dy;
    joyRef.current.x = nx / maxR;
    joyRef.current.y = ny / maxR;
    setJoyVec({ x: nx, y: ny });
  };

  const handleJoyEnd = () => {
    joyRef.current.active = false;
    joyRef.current.x = 0;
    joyRef.current.y = 0;
    setJoyVec({ x: 0, y: 0 });
  };

  const executeSensorAction = (sensor: WorldSensor) => {
    if (sensor.actionType === 'elevator' && sensor.targetFloor) {
      switchFloor(sensor.targetFloor, sensor.targetSpawn);
      return;
    }
    if (sensor.actionType === 'shop') {
      onOpenShop();
      return;
    }
    if (sensor.actionType === 'mixology') {
      onStartMixology();
      return;
    }
    if (sensor.hotspotId) {
      const spot = TOWER_HOTSPOTS.find((h) => h.id === sensor.hotspotId);
      if (spot) {
        if (sensor.actionType === 'spa') onTriggerSpa(spot);
        else onTriggerSecret(spot);
      }
    }
  };

  return (
    <div className="freeroam-stage">
      <canvas
        ref={canvasRef}
        className="freeroam-canvas"
        onPointerDown={handleCanvasTap}
      />

      {/* Minimal Top-Right Floor Switcher (17F Suites ⇄ 18F Rooftop) */}
      <div className="freeroam-floor-bar">
        <button
          type="button"
          className={`floor-chip ${floorId === '17f' ? 'active' : ''}`}
          onClick={() => switchFloor('17f')}
        >
          17F {locale === 'ckb' ? 'ژوورەکان' : 'Suites'}
        </button>
        <button
          type="button"
          className={`floor-chip ${floorId === '18f' ? 'active' : ''}`}
          onClick={() => switchFloor('18f')}
        >
          18F {locale === 'ckb' ? 'سەربان 🌊' : 'Rooftop 🌊'}
        </button>
      </div>

      {/* Contextual Spring-Animated Proximity Prompt (Estella + OpenMotion style) */}
      <AnimatePresence>
        {(nearHeroine || nearSensor) && (
          <motion.div
            className="proximity-action-stack"
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            {nearHeroine && (
              <button
                type="button"
                className="prox-btn heroine"
                onClick={() =>
                  onEngageHeroine(
                    nearHeroine,
                    floorId === '18f' ? 'pool' : 'suite'
                  )
                }
              >
                <span>💬</span>
                <strong>
                  {locale === 'ckb'
                    ? `قسەکردن و ژوان لەگەڵ ${HEROINES[nearHeroine].name.ckb}`
                    : `Talk & Flirt with ${HEROINES[nearHeroine].name.en}`}
                </strong>
              </button>
            )}

            {nearSensor && (
              <button
                type="button"
                className="prox-btn sensor"
                onClick={() => executeSensorAction(nearSensor)}
              >
                <span>{nearSensor.icon}</span>
                <strong>{loc(nearSensor.prompt, locale)}</strong>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Virtual Analog Thumbstick for Mobile */}
      <div
        className="virtual-joystick-zone"
        onPointerDown={handleJoyStart}
        onPointerMove={handleJoyMove}
        onPointerUp={handleJoyEnd}
        onPointerCancel={handleJoyEnd}
      >
        <div
          className="virtual-joystick-knob"
          style={{
            transform: `translate3d(${joyVec.x}px, ${joyVec.y}px, 0)`,
          }}
        />
      </div>
    </div>
  );
};
