import React, { useEffect, useRef, useState } from 'react';
import { computeRank } from '../data/catalog';
import { STORY_SAGA_CHAPTERS } from '../data/storySagaPart3';
import type { SagaChoice } from '../data/storySagaTypes';
import { TOWER_HOTSPOTS, type TowerHotspot } from '../data/towerMap';
import { ZONE_ORDER_25D, ZONES_25D, type Npc25D, type Sensor25D, type Zone25DId } from '../data/world25dZones';
import type { GameState, HeroineId, Locale, LocationId } from '../types/game';
import { CityPoiModal, type ActiveCityBuilding } from './CityPoiModal';
import { StorySagaModal } from './StorySagaModal';
import { World25DCanvas } from './World25DCanvas';

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
  // Start right in the bright 2.5D Grand Velvet City Plaza so everything feels fresh!
  const [zoneId, setZoneId] = useState<Zone25DId>('city');
  const [zoomClose, setZoomClose] = useState(false);
  const [sprinting, setSprinting] = useState(false);
  const [drivingCar, setDrivingCar] = useState(false);
  const [companionId, setCompanionId] = useState<HeroineId | null>('layla');

  const [nearSensor, setNearSensor] = useState<Sensor25D | null>(null);
  const [nearNpc, setNearNpc] = useState<Npc25D | null>(null);
  const [activeCityBuilding, setActiveCityBuilding] = useState<ActiveCityBuilding>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

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
      // ignore
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

  const joyVecRef = useRef({ x: 0, y: 0 });
  const [joyUi, setJoyUi] = useState({ x: 0, y: 0, active: false });
  const joyOriginRef = useRef({ x: 0, y: 0 });

  const flashBanner = (ku: string, en: string) => {
    setBannerNotice(isKu ? ku : en);
    setTimeout(() => setBannerNotice(null), 2600);
  };

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

  const activateSensor = (s: Sensor25D) => {
    if (s.kind === 'goto_zone' && s.targetZone) {
      setDrivingCar(false);
      setZoneId(s.targetZone);
      const z = ZONES_25D[s.targetZone];
      flashBanner(`✦ ${z.titleKu}`, `✦ ${z.titleEn}`);
    } else if (s.kind === 'hospital') setActiveCityBuilding('hospital');
    else if (s.kind === 'mall') setActiveCityBuilding('mall');
    else if (s.kind === 'career') setActiveCityBuilding('career');
    else if (s.kind === 'alley') setActiveCityBuilding('alley');
    else if (s.kind === 'casino') setActiveCityBuilding('casino');
    else if (s.kind === 'supercar') setDrivingCar((d) => !d);
    else if (s.kind === 'saga') openChapter(s.sagaChapter || sagaChapter);
    else if (s.kind === 'bed') onRestNight();
    else if (s.kind === 'bar') onStartMixology();
    else if (s.kind === 'shop') onOpenShop();
    else if (s.kind === 'sauna_heal') {
      if (onUpdateState) onUpdateState((p) => ({ ...p, energy: 3 }));
      flashBanner('🔥 لە ساونای شاهانە وزەت بە تەواوی پڕ بووەوە! (⚡ 3/3)', '🔥 Cedar Sauna restored full Energy (⚡ 3/3)!');
    } else if (s.kind === 'spa') {
      const spot = TOWER_HOTSPOTS.find((h) => h.id === s.hotspotId) || TOWER_HOTSPOTS[0];
      if (spot) onTriggerSpa(spot);
    }
  };

  const activateNpc = (n: Npc25D) => {
    if (n.cityModal) setActiveCityBuilding(n.cityModal);
    else if (n.id === 'layla' || n.id === 'celine' || n.id === 'aria') {
      onEngageHeroine(n.id, n.locId || 'suite');
    }
  };

  const cycleCompanion = () => {
    const order: (HeroineId | null)[] = ['layla', 'celine', 'aria', null];
    setCompanionId(order[(order.indexOf(companionId) + 1) % order.length]);
  };

  return (
    <div className="relative w-full h-[calc(100dvh-60px)] min-h-[430px] overflow-hidden bg-slate-950">
      {/* Pure 2D & 2.5D Hand-Painted Manhwa World */}
      <World25DCanvas
        zoneId={zoneId}
        locale={locale}
        zoomClose={zoomClose}
        sprinting={sprinting}
        drivingCar={drivingCar}
        companionId={companionId}
        joyVecRef={joyVecRef}
        onNearSensor={setNearSensor}
        onNearNpc={setNearNpc}
        onAutoActivateSensor={activateSensor}
        onAutoActivateNpc={activateNpc}
      />

      {/* Zone Arrival Toast */}
      {bannerNotice && (
        <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-slate-950/90 border border-amber-300/60 text-amber-200 text-xs sm:text-sm font-extrabold shadow-xl">
          {bannerNotice}
        </div>
      )}

      {/* Clean Top 2.5D Floor & City Bar */}
      <div className="absolute top-2 inset-x-2 z-20 flex flex-wrap items-center justify-between gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-1 overflow-x-auto max-w-full bg-slate-950/85 backdrop-blur-md px-1.5 py-1 rounded-full border border-amber-300/30 shadow-lg">
          {ZONE_ORDER_25D.map((zid) => {
            const z = ZONES_25D[zid];
            const active = zoneId === zid;
            return (
              <button
                key={zid}
                onClick={() => {
                  setDrivingCar(false);
                  setZoneId(zid);
                  flashBanner(`✦ ${z.titleKu}`, `✦ ${z.titleEn}`);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap transition ${
                  active
                    ? 'bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 shadow'
                    : 'text-amber-100/85 hover:bg-white/10'
                }`}
              >
                {isKu ? z.badgeKu : z.badgeEn}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSagaOpen(true)}
            className="px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[11px] sm:text-xs font-extrabold shadow-lg border border-amber-200/50"
          >
            📖 {isKu ? `چیرۆک (${sagaChapter}/12)` : `Story (${sagaChapter}/12)`}
          </button>
          <button
            onClick={cycleCompanion}
            className="px-2.5 py-1 rounded-full bg-slate-950/85 border border-pink-400/50 text-pink-200 text-[11px] font-bold"
          >
            🤝{' '}
            {companionId === 'layla'
              ? isKu ? 'لەیلا' : 'Layla'
              : companionId === 'celine'
              ? isKu ? 'سێلین' : 'Celine'
              : companionId === 'aria'
              ? isKu ? 'ئاریا' : 'Aria'
              : isKu ? 'تەنها' : 'Solo'}
          </button>
          <button
            onClick={() => setZoomClose((z) => !z)}
            className="px-2.5 py-1 rounded-full bg-slate-950/85 border border-sky-400/40 text-sky-200 text-[11px] font-bold"
          >
            🔍 {zoomClose ? (isKu ? 'گشتی' : 'Wide') : '2.5D+'}
          </button>
        </div>
      </div>

      {/* Bottom-Left Smooth 2.5D Virtual Thumbstick */}
      <div
        className="absolute bottom-4 left-4 z-20 w-22 h-22 rounded-full bg-slate-950/60 border-2 border-amber-300/45 backdrop-blur-md flex items-center justify-center touch-none select-none"
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
          const maxR = 32;
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
          className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-rose-400 shadow-lg border border-white/70"
        />
      </div>

      {/* Bottom-Right Context Action Buttons */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        {nearNpc && (
          <button
            onClick={() => activateNpc(nearNpc)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white text-xs sm:text-sm font-extrabold shadow-xl border border-pink-200/70"
          >
            💬 {isKu ? `گفتوگۆ لەگەڵ ${nearNpc.nameKu}` : `Talk to ${nearNpc.nameEn}`}
          </button>
        )}

        {nearSensor && (
          <button
            onClick={() => activateSensor(nearSensor)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 text-xs sm:text-sm font-extrabold shadow-xl border border-white/80"
          >
            {nearSensor.icon} {isKu ? nearSensor.labelKu : nearSensor.labelEn}
          </button>
        )}

        <div className="flex items-center gap-1.5">
          {zoneId === 'city' && (
            <button
              onClick={() => setDrivingCar((d) => !d)}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold border shadow-lg ${
                drivingCar
                  ? 'bg-rose-600 text-white border-amber-200'
                  : 'bg-slate-950/90 text-amber-200 border-amber-400/40'
              }`}
            >
              🏎️ {drivingCar ? (isKu ? 'دابەزین' : 'Exit Car') : isKu ? 'سەیارە' : 'Supercar'}
            </button>
          )}
          <button
            onClick={() => setSprinting((s) => !s)}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold border shadow-lg ${
              sprinting
                ? 'bg-sky-400 text-slate-950 border-white'
                : 'bg-slate-950/90 text-sky-200 border-sky-400/40'
            }`}
          >
            ⚡ {isKu ? 'غاردان' : 'Sprint'}
          </button>
        </div>
      </div>

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
          setDrivingCar(false);
          if (locId === 'hotel_17f') setZoneId('17f');
          else if (locId === 'hotel_18f') setZoneId('18f');
          else {
            setZoneId('city');
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
