import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HEROINES, loc, MOOD_META } from '../data/catalog';
import { HEROINE_OUTFITS, SIPAN_OUTFITS } from '../data/outfits';
import { TOWER_HOTSPOTS, TowerHotspot } from '../data/towerMap';
import { FloorId, RectBox, WORLD_FLOORS, WorldSensor } from '../data/worldFloors';
import { GameState, HeroineId, Locale, LocationId } from '../types/game';
import {
  drawAnimatedRpgCharacter,
  drawBrightMinimap,
  drawRoomBannerLabel,
  drawWorldVfx,
  FootstepSpark,
  RippleRing,
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
  onRestNight: () => void;
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
  onRestNight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [floorId, setFloorId] = useState<FloorId>('17f');
  const [zoomMode, setZoomMode] = useState<'close' | 'wide'>(() =>
    typeof window !== 'undefined' && window.innerHeight < 520 ? 'wide' : 'close'
  );
  const [nearHeroine, setNearHeroine] = useState<HeroineId | null>(null);
  const [nearSensor, setNearSensor] = useState<WorldSensor | null>(null);
  const [joyVec, setJoyVec] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const playerRef = useRef({ x: 1120, y: 740, walkPhase: 0, facingX: 1 });
  const camRef = useRef({ x: 1120, y: 740 });
  const targetWalkRef = useRef<{ x: number; y: number } | null>(null);
  const joyRef = useRef({ x: 0, y: 0, active: false, originX: 0, originY: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const imagesCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const ripplesRef = useRef<RippleRing[]>([]);
  const sparksRef = useRef<FootstepSpark[]>([]);

  // Preload high-res floor maps + character portraits
  useEffect(() => {
    const urls = [
      '/assets/world_17f_map.jpg',
      '/assets/world_18f_map.jpg',
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

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

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
      const zoom = zoomMode === 'wide' ? 0.62 : 0.96;
      const p = playerRef.current;
      const speed = 335;
      const radius = 22;

      // 1. Input
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
        if (dist < 14) {
          targetWalkRef.current = null;
        } else {
          ix = dx / dist;
          iy = dy / dist;
        }
      }

      // 2. Kinematic Swept Move with Doorway Wall Slide
      const tryX = p.x + ix * speed * dt;
      if (!floor.walls.some((b) => circleHitsRect(tryX, p.y, radius, b))) {
        p.x = tryX;
      }
      const tryY = p.y + iy * speed * dt;
      if (!floor.walls.some((b) => circleHitsRect(p.x, tryY, radius, b))) {
        p.y = tryY;
      }

      const moving = Math.hypot(ix, iy) > 0.05;
      if (Math.abs(ix) > 0.08) p.facingX = ix > 0 ? 1 : -1;

      const inWater = floor.waterZones.some(
        (wz) => p.x > wz.x && p.x < wz.x + wz.w && p.y > wz.y && p.y < wz.y + wz.h
      );

      if (moving) {
        p.walkPhase += dt * 13;
        if (inWater && Math.random() < 0.36) {
          ripplesRef.current.push({
            x: p.x,
            y: p.y + 12,
            r: 12,
            alpha: 0.85,
            color: '103, 232, 249',
          });
        } else if (!inWater && Math.random() < 0.25) {
          sparksRef.current.push({
            x: p.x + (Math.random() - 0.5) * 14,
            y: p.y + 34,
            alpha: 0.75,
          });
        }
      }

      // 3. Smooth Follow Camera with Zoom Bounds
      const cam = camRef.current;
      cam.x += (p.x - cam.x) * Math.min(1, dt * 8.5);
      cam.y += (p.y - cam.y) * Math.min(1, dt * 8.5);

      const viewW = cw / zoom;
      const viewH = ch / zoom;
      const halfW = viewW / 2;
      const halfH = viewH / 2;
      const clampedCamX =
        floor.width > viewW
          ? Math.max(halfW, Math.min(floor.width - halfW, cam.x))
          : floor.width / 2;
      const clampedCamY =
        floor.height > viewH
          ? Math.max(halfH, Math.min(floor.height - halfH, cam.y))
          : floor.height / 2;

      // 4. Active Heroines on Current Floor + Proximity Check
      let foundHeroine: HeroineId | null = null;
      const outfitPalette: Record<HeroineId, string> = {
        layla: '#be123c',
        celine: '#6d28d9',
        aria: '#d97706',
      };
      const activeGirls: Array<{
        id: HeroineId;
        x: number;
        y: number;
        color: string;
        loc: LocationId;
        inWater: boolean;
      }> = [];

      (['layla', 'celine', 'aria'] as HeroineId[]).forEach((hid) => {
        const spot = floor.heroineSpots[hid];
        if (spot.floor === floorId) {
          const gx = spot.x + Math.sin(timeSec * 1.2 + hid.length * 2) * 20;
          const gy = spot.y + Math.cos(timeSec * 0.9 + hid.length) * 12;
          const gWater = floor.waterZones.some(
            (wz) => gx > wz.x && gx < wz.x + wz.w && gy > wz.y && gy < wz.y + wz.h
          );
          activeGirls.push({
            id: hid,
            x: gx,
            y: gy,
            color: HEROINES[hid].color,
            loc: spot.loc,
            inWater: gWater,
          });
          if (Math.hypot(p.x - gx, p.y - gy) < 140) {
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

      // 5. Render Ultra-Bright Illustrated World + 60fps VFX!
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();
      ctx.translate(cw / 2, ch / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-clampedCamX, -clampedCamY);

      // Draw High-Res Illustrated Luxury Floor Map (100% Bright & Crisp!)
      const mapImg = imagesCacheRef.current[floor.mapImage];
      if (mapImg && mapImg.complete && mapImg.naturalWidth > 0) {
        ctx.drawImage(mapImg, 0, 0, floor.width, floor.height);
      }

      // Additive 60fps Lighting, Water Caustics, Steam, Rose Petals & Jazz Notes
      for (const vfx of floor.vfx) {
        drawWorldVfx(ctx, vfx, timeSec);
      }

      // Interactive Glowing Sensor Rings
      for (const s of floor.sensors) {
        const pulse = 0.55 + Math.sin(timeSec * 3.8 + s.x) * 0.25;
        ctx.save();
        ctx.fillStyle = 'rgba(15, 10, 28, 0.55)';
        ctx.strokeStyle = `rgba(253, 224, 71, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 28 + Math.sin(timeSec * 3.2) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = '22px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(s.icon, s.x, s.y + 8);
        ctx.restore();
      }

      // Tap-to-walk glowing beacon & path line
      if (targetWalkRef.current) {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 20);
        ctx.lineTo(targetWalkRef.current.x, targetWalkRef.current.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(
          targetWalkRef.current.x,
          targetWalkRef.current.y,
          18 + Math.sin(timeSec * 8) * 5,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }

      // Golden Footstep Sparks & Water Ripples
      sparksRef.current = sparksRef.current.filter((sp) => sp.alpha > 0.04);
      for (const sp of sparksRef.current) {
        sp.alpha -= dt * 1.4;
        ctx.fillStyle = `rgba(253, 224, 71, ${sp.alpha})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ripplesRef.current = ripplesRef.current.filter((rp) => rp.alpha > 0.03);
      for (const rp of ripplesRef.current) {
        rp.r += dt * 48;
        rp.alpha -= dt * 0.85;
        ctx.strokeStyle = `rgba(${rp.color || '186, 230, 253'}, ${rp.alpha})`;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Room Title Banners
      for (const lbl of floor.labels) {
        drawRoomBannerLabel(ctx, lbl, locale);
      }

      // Y-Sorted Full-Figure Animated RPG Characters (Heroines + Sipan!)
      const sipanImgUrl =
        SIPAN_OUTFITS.find((s) => s.id === sipanOutfit)?.image ||
        '/assets/sipan_penthouse.jpg';

      const drawables = [
        ...activeGirls.map((g) => {
          const eqId = equippedOutfits[g.id];
          const imgUrl =
            HEROINE_OUTFITS[g.id].find((o) => o.id === eqId)?.image ||
            HEROINES[g.id].avatar;
          const star = hasStoryReady(g.id) ? ' ★' : '';
          return {
            y: g.y,
            render: () =>
              drawAnimatedRpgCharacter(ctx, {
                x: g.x,
                y: g.y,
                img: imagesCacheRef.current[imgUrl],
                primaryColor: g.color,
                outfitColor: outfitPalette[g.id],
                label: `${MOOD_META[state.heroines[g.id].mood].icon} ${HEROINES[g.id].name[locale]}${star}`,
                moving: true,
                walkPhase: timeSec * 3.2 + g.x * 0.02,
                facingX: p.x >= g.x ? 1 : -1,
                inWater: g.inWater,
                isPlayer: false,
                timeSec,
              }),
          };
        }),
        {
          y: p.y,
          render: () =>
            drawAnimatedRpgCharacter(ctx, {
              x: p.x,
              y: p.y,
              img: imagesCacheRef.current[sipanImgUrl],
              primaryColor: '#38bdf8',
              outfitColor: sipanOutfit === 'sipan_pool' ? '#0f172a' : '#1e3a8a',
              label: locale === 'ckb' ? '👑 سیپان' : '👑 Sipan',
              moving,
              walkPhase: p.walkPhase,
              facingX: p.facingX,
              inWater,
              isPlayer: true,
              timeSec,
            }),
        },
      ].sort((a, b) => a.y - b.y);

      for (const d of drawables) {
        d.render();
      }

      ctx.restore(); // end world camera

      // Bright Illustrated Minimap Radar
      drawBrightMinimap(
        ctx,
        floor,
        mapImg,
        p,
        activeGirls.map((g) => ({ x: g.x, y: g.y, color: g.color }))
      );

      ctx.restore();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [equippedOutfits, floorId, hasStoryReady, locale, sipanOutfit, state.heroines, zoomMode]);

  const handleCanvasTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    if (sx < 155 && sy < 140) return;

    const floor = WORLD_FLOORS[floorId];
    const zoom = zoomMode === 'wide' ? 0.62 : 0.96;
    const viewW = rect.width / zoom;
    const viewH = rect.height / zoom;
    const clampedCamX =
      floor.width > viewW
        ? Math.max(viewW / 2, Math.min(floor.width - viewW / 2, camRef.current.x))
        : floor.width / 2;
    const clampedCamY =
      floor.height > viewH
        ? Math.max(viewH / 2, Math.min(floor.height - viewH / 2, camRef.current.y))
        : floor.height / 2;

    const wx = (sx - rect.width / 2) / zoom + clampedCamX;
    const wy = (sy - rect.height / 2) / zoom + clampedCamY;
    targetWalkRef.current = {
      x: Math.max(70, Math.min(floor.width - 70, wx)),
      y: Math.max(75, Math.min(floor.height - 75, wy)),
    };
  };

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
    const maxR = 40;
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
    if (sensor.actionType === 'rest') {
      onRestNight();
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

  const activeHeroineSpot = nearHeroine
    ? WORLD_FLOORS[floorId].heroineSpots[nearHeroine]
    : null;

  return (
    <div className="freeroam-stage">
      <canvas
        ref={canvasRef}
        className="freeroam-canvas"
        onPointerDown={handleCanvasTap}
      />

      {/* Floor + Camera Zoom Controls */}
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
        <button
          type="button"
          className="floor-chip zoom-btn"
          onClick={() => setZoomMode((z) => (z === 'wide' ? 'close' : 'wide'))}
        >
          {zoomMode === 'wide' ? '🔍+' : '🔍-'}
        </button>
      </div>

      {/* Contextual Spring-Animated Proximity Prompt */}
      <AnimatePresence>
        {(nearHeroine || nearSensor) && (
          <motion.div
            className="proximity-action-stack"
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            {nearHeroine && (
              <button
                type="button"
                className="prox-btn heroine"
                onClick={() =>
                  onEngageHeroine(
                    nearHeroine,
                    activeHeroineSpot?.loc || (floorId === '18f' ? 'pool' : 'suite')
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

      {/* Virtual Analog Thumbstick */}
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
