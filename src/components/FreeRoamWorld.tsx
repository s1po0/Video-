import React, { useEffect, useRef, useState } from 'react';
import { computeRank } from '../data/catalog';
import { STORY_SAGA_CHAPTERS } from '../data/storySagaPart3';
import type { SagaChoice } from '../data/storySagaTypes';
import { TOWER_HOTSPOTS, type TowerHotspot } from '../data/towerMap';
import type { GameState, HeroineId, Locale, LocationId } from '../types/game';
import type { NpcSpawn3D, World3DSensor, WorldZoneId } from '../utils/world3dHotelBuilder';
import { CityPoiModal, type ActiveCityBuilding } from './CityPoiModal';
import { StorySagaModal } from './StorySagaModal';
import { World3DCanvas, type ProjectedMarker } from './World3DCanvas';

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
  onUpdateState?: React.Dispatch<React.SetStateAction<GameState>>;
}

const SAGA_STORAGE_KEY = 'midnight_velvet_v3_saga';

export const FreeRoamWorld: React.FC<FreeRoamWorldProps> = ({
  state,
  locale,
  onEngageHeroine,
  onTriggerSpa,
  onOpenShop,
  onStartMixology,
  onRestNight,
  onUpdateState,
}) => {
  const isKu = locale === 'ckb';
  const [zone, setZone] = useState<WorldZoneId>('17f');
  const [zoomFar, setZoomFar] = useState(false);
  const [sprinting, setSprinting] = useState(false);
  const [drivingCar, setDrivingCar] = useState(false);
  const [companionId, setCompanionId] = useState<HeroineId | null>(null);

  const [nearSensor, setNearSensor] = useState<World3DSensor | null>(null);
  const [nearNpc, setNearNpc] = useState<NpcSpawn3D | null>(null);
  const [markers, setMarkers] = useState<ProjectedMarker[]>([]);
  const [activeCityBuilding, setActiveCityBuilding] = useState<ActiveCityBuilding>(null);

  // Story-Skills 12-Chapter Saga state
  const [sagaOpen, setSagaOpen] = useState(false);
  const [sagaChapter, setSagaChapter] = useState<number>(1);
  const [unlockedChapters, setUnlockedChapters] = useState<number[]>([1]);
  const [unlockedClues, setUnlockedClues] = useState<string[]>([]);
  const [debunkedClues, setDebunkedClues] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAGA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.sagaChapter) setSagaChapter(parsed.sagaChapter);
        if (Array.isArray(parsed.unlockedChapters)) setUnlockedChapters(parsed.unlockedChapters);
        if (Array.isArray(parsed.unlockedClues)) setUnlockedClues(parsed.unlockedClues);
        if (Array.isArray(parsed.debunkedClues)) setDebunkedClues(parsed.debunkedClues);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        SAGA_STORAGE_KEY,
        JSON.stringify({ sagaChapter, unlockedChapters, unlockedClues, debunkedClues })
      );
    } catch {
      // ignore
    }
  }, [sagaChapter, unlockedChapters, unlockedClues, debunkedClues]);

  // Virtual Joystick state
  const joyVecRef = useRef({ x: 0, y: 0 });
  const [joyUi, setJoyUi] = useState({ x: 0, y: 0, active: false });
  const joyOriginRef = useRef({ x: 0, y: 0 });

  const openChapter = (num: number) => {
    setUnlockedChapters((prev) => (prev.includes(num) ? prev : [...prev, num]));
    setSagaChapter(num);
    setSagaOpen(true);
  };

  const handleSagaChoice = (chapterNum: number, ch: SagaChoice) => {
    const chObj = STORY_SAGA_CHAPTERS.find((c) => c.number === chapterNum);
    const nextNum = ch.nextChapter;
    setUnlockedChapters((prev) => (prev.includes(nextNum) ? prev : [...prev, nextNum]));
    setSagaChapter(nextNum);

    const clueToUnlock = ch.unlockClueId || chObj?.plantedClueId;
    if (clueToUnlock) {
      setUnlockedClues((prev) => (prev.includes(clueToUnlock) ? prev : [...prev, clueToUnlock]));
    }
    if (chObj?.debunkedClueId) {
      const db = chObj.debunkedClueId;
      setDebunkedClues((prev) => (prev.includes(db) ? prev : [...prev, db]));
    }

    if (onUpdateState) {
      onUpdateState((prev) => {
        const next = { ...prev, heroines: { ...prev.heroines } };
        if (ch.moneyDelta) next.cash = Math.max(0, next.cash + ch.moneyDelta);
        if (ch.statDelta?.charm) next.charm += ch.statDelta.charm;
        if (ch.statDelta?.wit) next.wit += ch.statDelta.wit;
        if (ch.statDelta?.boldness) next.boldness += ch.statDelta.boldness;
        if (clueToUnlock) next.rubyClues = Math.min(3, next.rubyClues + 1);
        if (ch.heroine) {
          const h = { ...next.heroines[ch.heroine] };
          h.affection += ch.affectionDelta || 0;
          h.trust = Math.min(100, h.trust + (ch.trustDelta || 0));
          h.desire = Math.min(100, h.desire + (ch.passionDelta || 0));
          h.rank = computeRank(h.affection);
          next.heroines[ch.heroine] = h;
        }
        return next;
      });
    }
  };

  const triggerSensorAction = (s: World3DSensor) => {
    if (s.kind === 'portal_17f') { setDrivingCar(false); setZone('17f'); }
    else if (s.kind === 'portal_18f') { setDrivingCar(false); setZone('18f'); }
    else if (s.kind === 'portal_city') { setZone('city'); }
    else if (s.kind === 'bed') onRestNight();
    else if (s.kind === 'bar') onStartMixology();
    else if (s.kind === 'shop') {
      if (zone === 'city') setActiveCityBuilding('mall');
      else onOpenShop();
    } else if (s.kind === 'spa') {
      const spot = TOWER_HOTSPOTS.find((h) => h.id === s.hotspotId) || TOWER_HOTSPOTS[0];
      if (spot) onTriggerSpa(spot);
    } else if (s.kind === 'saga') {
      openChapter(zone === '18f' ? 6 : sagaChapter);
    } else if (s.kind === 'hospital') setActiveCityBuilding('hospital');
    else if (s.kind === 'career') setActiveCityBuilding('career');
    else if (s.kind === 'alley') setActiveCityBuilding('alley');
    else if (s.kind === 'supercar') setDrivingCar((d) => !d);
  };

  const triggerNpcAction = (npc: NpcSpawn3D) => {
    if (npc.cityBuilding) {
      setActiveCityBuilding(npc.cityBuilding);
    } else if (npc.id === 'layla' || npc.id === 'celine' || npc.id === 'aria') {
      onEngageHeroine(npc.id, npc.locId || 'suite');
    }
  };

  const cycleCompanion = () => {
    const order: (HeroineId | null)[] = [null, 'layla', 'celine', 'aria'];
    const idx = order.indexOf(companionId);
    setCompanionId(order[(idx + 1) % order.length]);
  };

  return (
    <div className="relative w-full h-[calc(100dvh-64px)] min-h-[430px] overflow-hidden bg-slate-950 rounded-b-2xl">
      {/* Real-Time Three.js Studio 3D Viewport */}
      <World3DCanvas
        zone={zone}
        zoomFar={zoomFar}
        sprinting={sprinting}
        drivingCar={drivingCar}
        companionId={companionId}
        joyVecRef={joyVecRef}
        onNearSensor={setNearSensor}
        onNearNpc={setNearNpc}
        onMarkersUpdate={setMarkers}
      />

      {/* Exact 3D-Projected Floating World Markers (Zero Misalignment!) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
        {markers.map((m) => (
          <div
            key={m.id}
            style={{ transform: `translate(${m.x}px, ${m.y}px) translate(-50%, -100%)` }}
            className="absolute top-0 left-0 flex flex-col items-center"
          >
            <div
              className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold whitespace-nowrap shadow-lg border backdrop-blur-sm ${
                m.isNpc
                  ? 'bg-rose-950/85 border-pink-400/60 text-pink-100'
                  : 'bg-slate-950/85 border-amber-400/50 text-amber-100'
              }`}
            >
              {m.icon} {isKu ? m.labelKu : m.labelEn}
            </div>
          </div>
        ))}
      </div>

      {/* Top 3D Zone Switcher + Story-Skills 12-Chapter Saga Button */}
      <div className="absolute top-2.5 inset-x-2.5 z-20 flex flex-wrap items-center justify-between gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-lg">
          <button
            onClick={() => { setDrivingCar(false); setZone('17f'); }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold transition ${
              zone === '17f' ? 'bg-amber-400 text-slate-950' : 'text-amber-100 hover:bg-white/10'
            }`}
          >
            🏨 17F {isKu ? 'سویت' : 'Suites'}
          </button>
          <button
            onClick={() => { setDrivingCar(false); setZone('18f'); }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold transition ${
              zone === '18f' ? 'bg-cyan-400 text-slate-950' : 'text-cyan-100 hover:bg-white/10'
            }`}
          >
            🌊 18F {isKu ? 'مەلەوانگە' : 'Pool'}
          </button>
          <button
            onClick={() => setZone('city')}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition ${
              zone === 'city'
                ? 'bg-gradient-to-r from-emerald-400 to-sky-400 text-slate-950 shadow'
                : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
            }`}
          >
            🏙️ {isKu ? 'شاری گەورە (دەرەوە)' : 'Open City'}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSagaOpen(true)}
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 text-[11px] sm:text-xs font-extrabold shadow-lg animate-pulse"
          >
            📖 {isKu ? `چیرۆکی قووڵ (${sagaChapter}/12)` : `Story Saga (${sagaChapter}/12)`}
          </button>
          <button
            onClick={cycleCompanion}
            className="px-2.5 py-1.5 rounded-full bg-slate-900/90 border border-pink-400/50 text-pink-200 text-[11px] font-bold"
          >
            🤝{' '}
            {companionId
              ? companionId === 'layla'
                ? isKu ? 'لەیلا' : 'Layla'
                : companionId === 'celine'
                ? isKu ? 'سێلین' : 'Celine'
                : isKu ? 'ئاریا' : 'Aria'
              : isKu ? 'بەتەنها' : 'Solo'}
          </button>
          <button
            onClick={() => setZoomFar((z) => !z)}
            className="px-2.5 py-1.5 rounded-full bg-slate-900/90 border border-white/20 text-sky-200 text-[11px] font-bold"
          >
            🔍 {zoomFar ? '3D-' : '3D+'}
          </button>
        </div>
      </div>

      {/* Virtual 360° Thumbstick (Bottom-Left) */}
      <div
        className="absolute bottom-5 left-5 z-20 w-24 h-24 rounded-full bg-slate-900/65 border-2 border-amber-300/40 backdrop-blur-md flex items-center justify-center touch-none select-none"
        onPointerDown={(e) => {
          e.stopPropagation();
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          joyOriginRef.current = { x: e.clientX, y: e.clientY };
          setJoyUi({ x: 0, y: 0, active: true });
        }}
        onPointerMove={(e) => {
          if (!joyUi.active) return;
          const dx = e.clientX - joyOriginRef.current.x;
          const dy = e.clientY - joyOriginRef.current.y;
          const maxR = 34;
          const d = Math.hypot(dx, dy);
          const cx = d > maxR ? (dx / d) * maxR : dx;
          const cy = d > maxR ? (dy / d) * maxR : dy;
          joyVecRef.current = { x: cx / maxR, y: cy / maxR };
          setJoyUi({ x: cx, y: cy, active: true });
        }}
        onPointerUp={() => {
          joyVecRef.current = { x: 0, y: 0 };
          setJoyUi({ x: 0, y: 0, active: false });
        }}
      >
        <div
          style={{ transform: `translate(${joyUi.x}px, ${joyUi.y}px)` }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-rose-400 shadow-lg border border-white/60"
        />
      </div>

      {/* Right Action Cluster: Sprint / Supercar + Context Action Prompt */}
      <div className="absolute bottom-5 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        {nearNpc && (
          <button
            onClick={() => triggerNpcAction(nearNpc)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white text-xs sm:text-sm font-extrabold shadow-xl border border-pink-200/60"
          >
            💬 {isKu ? `گفتوگۆ لەگەڵ ${nearNpc.nameKu}` : `Talk to ${nearNpc.nameEn}`}
          </button>
        )}

        {nearSensor && (
          <button
            onClick={() => triggerSensorAction(nearSensor)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs sm:text-sm font-extrabold shadow-xl border border-white/60"
          >
            {nearSensor.icon} {isKu ? nearSensor.labelKu : nearSensor.labelEn}
          </button>
        )}

        <div className="flex items-center gap-2">
          {zone === 'city' && (
            <button
              onClick={() => setDrivingCar((d) => !d)}
              className={`px-3.5 py-2 rounded-full text-xs font-extrabold border shadow-lg ${
                drivingCar
                  ? 'bg-red-500 text-white border-yellow-300'
                  : 'bg-slate-900/90 text-amber-200 border-amber-400/40'
              }`}
            >
              🏎️ {drivingCar ? (isKu ? 'دابەزین' : 'Exit Car') : isKu ? 'سەیارە' : 'Drive'}
            </button>
          )}
          <button
            onPointerDown={() => setSprinting(true)}
            onPointerUp={() => setSprinting(false)}
            onClick={() => setSprinting((s) => !s)}
            className={`px-3.5 py-2 rounded-full text-xs font-extrabold border shadow-lg ${
              sprinting
                ? 'bg-sky-400 text-slate-950 border-white'
                : 'bg-slate-900/90 text-sky-200 border-sky-400/40'
            }`}
          >
            ⚡ {isKu ? 'غاردان' : 'Sprint'}
          </button>
        </div>
      </div>

      {/* Open-World City Building Modal (Hospital, Career Work, Shopping Mall, Secret Alley) */}
      <CityPoiModal
        building={activeCityBuilding}
        locale={locale}
        cash={state.cash}
        energy={state.energy}
        onClose={() => setActiveCityBuilding(null)}
        onEarnWork={(amount, stat) => {
          if (!onUpdateState) return;
          onUpdateState((prev) => ({
            ...prev,
            cash: prev.cash + amount,
            charm: prev.charm + (stat === 'charm' ? 2 : 0),
            wit: prev.wit + (stat === 'wit' ? 2 : 0),
            boldness: prev.boldness + (stat === 'boldness' ? 2 : 0),
          }));
        }}
        onHospitalHeal={() => {
          if (!onUpdateState) return;
          onUpdateState((prev) => ({
            ...prev,
            cash: prev.cash >= 25 ? prev.cash - 25 : prev.cash,
            energy: 3,
          }));
        }}
        onUnlockClueWithCash={(cost) => {
          if (!onUpdateState) return;
          onUpdateState((prev) => ({
            ...prev,
            cash: Math.max(0, prev.cash - cost),
            rubyClues: Math.min(3, prev.rubyClues + 1),
          }));
        }}
        onOpenBoutique={onOpenShop}
        onOpenSagaChapter={openChapter}
      />

      {/* Story-Skills 12-Chapter Deep Saga & Clue Board Modal */}
      <StorySagaModal
        open={sagaOpen}
        locale={locale}
        currentChapter={sagaChapter}
        unlockedChapters={unlockedChapters}
        unlockedClues={unlockedClues}
        debunkedClues={debunkedClues}
        onClose={() => setSagaOpen(false)}
        onSelectChapter={(n) => setSagaChapter(n)}
        onChooseOption={handleSagaChoice}
        onTeleportToLocation={(locId) => {
          if (locId === 'hotel_17f') { setDrivingCar(false); setZone('17f'); }
          else if (locId === 'hotel_18f') { setDrivingCar(false); setZone('18f'); }
          else {
            setZone('city');
            if (locId === 'city_hospital') setActiveCityBuilding('hospital');
            else if (locId === 'city_career') setActiveCityBuilding('career');
            else if (locId === 'city_mall') setActiveCityBuilding('mall');
            else if (locId === 'city_alley') setActiveCityBuilding('alley');
          }
        }}
      />
    </div>
  );
};
