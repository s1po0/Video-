import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import {
  BedDouble,
  Download,
  FastForward,
  Flame,
  Gift,
  Heart,
  Home,
  Image as ImageIcon,
  Languages,
  Lock,
  MessageCircle,
  Moon,
  Play,
  RotateCcw,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Volume2,
  VolumeX,
  Wine,
  X,
  Zap,
} from 'lucide-react';
import { AtmosphereCanvas } from './components/AtmosphereCanvas';
import {
  ParticleBurstCanvas,
  triggerHaptic,
  useTraumaShake,
} from './components/JuiceLayer';
import { HeartbeatMinigame, MixologyMinigame } from './components/MiniGames';
import { PhoneOverlay } from './components/PhoneOverlay';
import {
  getEquippedOutfitImage,
} from './components/HotelTowerMap';
import { FreeRoamWorld } from './components/FreeRoamWorld';
import { WardrobeModal } from './components/WardrobeModal';
import { HEROINE_OUTFITS, SIPAN_OUTFITS } from './data/outfits';
import { TowerHotspot } from './data/towerMap';
import {
  computeRank,
  GALLERY_CGS,
  GIFTS_CATALOG,
  HEROINES,
  loc,
  LOCATIONS,
  MOOD_META,
  PHASE_NAMES,
  RANK_THRESHOLDS,
  RANK_TITLES,
} from './data/catalog';
import {
  ARRIVAL_PROLOGUE,
  buildDynamicDateScene,
  FINALE_ENDINGS,
  HEROINE_CHAPTERS,
  PHONE_THREADS,
  RUBY_CLUE_SCENES,
} from './data/encounters';
import {
  enrichDynamicScene,
  enrichStoryChapters,
} from './data/expandedBeats';
import { generateHeroineAiReply } from './utils/aiRoleplay';

const EXPANDED_CHAPTERS = enrichStoryChapters(HEROINE_CHAPTERS);
import {
  EncounterChoice,
  FinaleEnding,
  GameState,
  GiftItem,
  HeroineId,
  Locale,
  LocationId,
  MoodType,
  PersistentMeta,
  PhoneThread,
  SceneBeat,
  TimePhase,
} from './types/game';
import { audioEngine } from './utils/audioEngine';

const SAVE_STORAGE_KEY = 'midnight_velvet_v2_state';
const META_STORAGE_KEY = 'midnight_velvet_v2_meta';

const SPEAKER_LABELS: Record<
  SceneBeat['speaker'],
  { ckb: string; en: string; color: string }
> = {
  narrator: { ckb: 'گێڕەرەوە', en: 'Narrator', color: '#e2d4f0' },
  you: { ckb: 'سیپان', en: 'Sipan', color: '#60a5fa' },
  layla: { ckb: 'لەیلا', en: 'Layla', color: '#34d399' },
  celine: { ckb: 'سێلین', en: 'Celine', color: '#f472b6' },
  aria: { ckb: 'ئاریا', en: 'Aria', color: '#fbbf24' },
  all: { ckb: 'هەمووان', en: 'Everyone', color: '#fde047' },
};

function createInitialGameState(): GameState {
  return {
    version: 2,
    night: 1,
    phase: 0,
    energy: 3,
    cash: 180,
    charm: 1,
    wit: 1,
    boldness: 1,
    rubyClues: 0,
    inventory: { velvet_perfume: 1 },
    heroines: {
      layla: {
        id: 'layla',
        affection: 0,
        desire: 10,
        trust: 10,
        rank: 1,
        mood: 'flirty',
        unlockedChapter: 0,
        giftsGiven: 0,
        memories: [],
      },
      celine: {
        id: 'celine',
        affection: 0,
        desire: 10,
        trust: 10,
        rank: 1,
        mood: 'vulnerable',
        unlockedChapter: 0,
        giftsGiven: 0,
        memories: [],
      },
      aria: {
        id: 'aria',
        affection: 0,
        desire: 10,
        trust: 10,
        rank: 1,
        mood: 'heated',
        unlockedChapter: 0,
        giftsGiven: 0,
        memories: [],
      },
    },
    completedThreads: [],
    activeReplies: {},
    seenIntro: false,
  };
}

interface ActiveEncounter {
  title: { ckb: string; en: string };
  heroine?: HeroineId;
  chapterToMark?: number;
  beats: SceneBeat[];
  beatIndex: number;
  choices?: EncounterChoice[];
  pendingChoice?: EncounterChoice;
  ending?: FinaleEnding;
}

export const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>('ckb');
  const [screen, setScreen] = useState<'title' | 'hub' | 'scene'>('title');
  const [soundOn, setSoundOn] = useState(true);

  const [state, setState] = useState<GameState>(() => {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.version === 2) return parsed;
      }
    } catch {
      // ignore
    }
    return createInitialGameState();
  });

  const [meta, setMeta] = useState<PersistentMeta>(() => {
    const defaultSeeds = [
      'cg_sipan_trio',
      'sipan_penthouse',
      'sipan_pool',
      'cover_keyart',
    ];
    try {
      const raw = localStorage.getItem(META_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...parsed,
          unlockedCgs: Array.from(
            new Set([...defaultSeeds, ...(parsed.unlockedCgs || [])])
          ),
        };
      }
      return { unlockedCgs: defaultSeeds, unlockedEndings: [] };
    } catch {
      return { unlockedCgs: defaultSeeds, unlockedEndings: [] };
    }
  });

  const [encounter, setEncounter] = useState<ActiveEncounter | null>(null);
  const [revealedChars, setRevealedChars] = useState(0);
  const [heartbeatTarget, setHeartbeatTarget] = useState<HeroineId | null>(null);
  const [showMixology, setShowMixology] = useState(false);
  const [sceneAiDraft, setSceneAiDraft] = useState('');
  const [isSceneAiLoading, setIsSceneAiLoading] = useState(false);
  const [steamBlurLevel, setSteamBlurLevel] = useState(0);

  const [selectedLoc, setSelectedLoc] = useState<LocationId | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<TowerHotspot | null>(
    null
  );
  const [hubViewMode, setHubViewMode] = useState<'tower' | 'cards'>('tower');
  const [sipanOutfit, setSipanOutfit] = useState<string>(() => {
    try {
      return localStorage.getItem('midnight_velvet_sipan_v25') || 'sipan_penthouse';
    } catch {
      return 'sipan_penthouse';
    }
  });
  const [equippedOutfits, setEquippedOutfits] = useState<
    Record<HeroineId, string>
  >(() => {
    try {
      const saved = localStorage.getItem('midnight_velvet_outfits_v23');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      layla: 'layla_crimson',
      celine: 'celine_dress',
      aria: 'aria_swim',
    };
  });
  const [modal, setModal] = useState<
    null | 'phone' | 'dossier' | 'shop' | 'gallery' | 'wardrobe'
  >(null);
  const [giftTarget, setGiftTarget] = useState<HeroineId | null>(null);
  const [zoomCg, setZoomCg] = useState<string | null>(null);

  const [bannerToast, setBannerToast] = useState<string | null>(null);
  const [burst, setBurst] = useState<{
    id: number;
    x: number;
    y: number;
    kind: 'heart' | 'flame' | 'gold';
  } | null>(null);

  const { offset: shakeOffset, addTrauma } = useTraumaShake(true);

  useEffect(() => {
    document.documentElement.dir = locale === 'ckb' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
    } catch {
      // ignore
    }
  }, [meta]);

  const fireBurst = useCallback(
    (kind: 'heart' | 'flame' | 'gold', x?: number, y?: number) => {
      setBurst({
        id: Date.now() + Math.random(),
        x: x ?? window.innerWidth / 2,
        y: y ?? window.innerHeight * 0.52,
        kind,
      });
    },
    []
  );

  const showToast = useCallback((msg: string) => {
    setBannerToast(msg);
    window.setTimeout(() => setBannerToast(null), 2600);
  }, []);

  const unlockCgId = useCallback((cgId?: string) => {
    if (!cgId) return;
    setMeta((prev) =>
      prev.unlockedCgs.includes(cgId)
        ? prev
        : { ...prev, unlockedCgs: [...prev.unlockedCgs, cgId] }
    );
  }, []);

  // Available unread phone threads
  const availableThreads = useMemo(() => {
    return PHONE_THREADS.filter(
      (th) =>
        !state.completedThreads.includes(th.id) &&
        state.night >= th.minNight &&
        state.heroines[th.heroine].affection >= th.minAffection
    );
  }, [state.completedThreads, state.heroines, state.night]);

  // Helper: advance time phase when spending 1 energy
  const advanceTimeAndUpdateHeroine = useCallback(
    (
      heroineId: HeroineId | null,
      affDelta: number,
      desireDelta: number,
      trustDelta: number,
      extra?: {
        chapterCompleted?: number;
        memory?: { ckb: string; en: string };
        spendEnergy?: boolean;
        cashDelta?: number;
        charmDelta?: number;
      }
    ) => {
      setState((prev) => {
        const spend = extra?.spendEnergy ?? true;
        const nextEnergy = spend ? Math.max(0, prev.energy - 1) : prev.energy;
        const nextPhase = spend
          ? (Math.min(3, prev.phase + 1) as TimePhase)
          : prev.phase;

        const nextHeroines = { ...prev.heroines };
        if (heroineId) {
          const cur = nextHeroines[heroineId];
          const newAff = Math.max(0, cur.affection + affDelta);
          const newRank = computeRank(newAff);
          nextHeroines[heroineId] = {
            ...cur,
            affection: newAff,
            desire: Math.min(100, Math.max(0, cur.desire + desireDelta)),
            trust: Math.min(100, Math.max(0, cur.trust + trustDelta)),
            rank: newRank,
            unlockedChapter: extra?.chapterCompleted
              ? Math.max(cur.unlockedChapter, extra.chapterCompleted)
              : cur.unlockedChapter,
            memories: extra?.memory
              ? [...cur.memories, extra.memory]
              : cur.memories,
          };
        }

        return {
          ...prev,
          energy: nextEnergy,
          phase: nextPhase,
          cash: Math.max(0, prev.cash + (extra?.cashDelta || 0)),
          charm: prev.charm + (extra?.charmDelta || 0),
          heroines: nextHeroines,
        };
      });
    },
    []
  );

  // Current scene beat typewriter
  const activeBeat: SceneBeat | null = useMemo(() => {
    if (!encounter) return null;
    return encounter.beats[encounter.beatIndex] || null;
  }, [encounter]);

  const beatText = activeBeat ? activeBeat.text[locale] : '';
  const isTyping = activeBeat ? revealedChars < beatText.length : false;

  useEffect(() => {
    if (screen !== 'scene' || !activeBeat) return;
    setRevealedChars(0);
    if (activeBeat.unlockCg) unlockCgId(activeBeat.unlockCg);
    if (activeBeat.effect && activeBeat.effect !== 'none') {
      audioEngine.playEffect(
        activeBeat.effect === 'shake' ? 'lightning' : activeBeat.effect
      );
      if (activeBeat.effect === 'lightning' || activeBeat.effect === 'shake') {
        addTrauma(0.65);
        triggerHaptic('medium');
      } else if (activeBeat.effect === 'heartbeat') {
        addTrauma(0.28);
        triggerHaptic('small');
      }
    }
  }, [activeBeat, addTrauma, screen, unlockCgId]);

  useEffect(() => {
    if (screen !== 'scene' || !activeBeat) return;
    if (revealedChars >= beatText.length) return;
    const tmr = window.setTimeout(() => {
      setRevealedChars((c) => Math.min(beatText.length, c + 3));
    }, 18);
    return () => window.clearTimeout(tmr);
  }, [activeBeat, beatText.length, revealedChars, screen]);

  const startFreshGame = () => {
    audioEngine.init();
    audioEngine.setMood('midnight_jazz');
    triggerHaptic('medium');
    const fresh = createInitialGameState();
    fresh.seenIntro = true;
    setState(fresh);
    setEncounter({
      title: { ckb: 'شەوی ١ • گەیشتن بۆ نهۆمی ١٧', en: 'Night 1 • Penthouse Arrival' },
      beats: ARRIVAL_PROLOGUE,
      beatIndex: 0,
    });
    setScreen('scene');
  };

  const continueSavedGame = () => {
    audioEngine.init();
    audioEngine.setMood('midnight_jazz');
    if (!state.seenIntro) {
      startFreshGame();
      return;
    }
    setScreen('hub');
  };

  // Who is at a given location right now?
  const getHeroinesAtLocation = useCallback(
    (locId: LocationId): HeroineId[] => {
      const list: HeroineId[] = [];
      (['layla', 'celine', 'aria'] as HeroineId[]).forEach((hid) => {
        const scheduled = HEROINES[hid].schedule[state.phase];
        // Also if Suite 1709 & heroine is Rank 4+, she can visit late at night!
        if (scheduled === locId) {
          list.push(hid);
        } else if (
          locId === 'suite' &&
          state.heroines[hid].affection >= 105 &&
          state.heroines[hid].unlockedChapter === 3
        ) {
          list.push(hid);
        }
      });
      return list;
    },
    [state.heroines, state.phase]
  );

  const getNextAvailableChapter = useCallback(
    (hid: HeroineId) => {
      const hState = state.heroines[hid];
      const nextNum = hState.unlockedChapter + 1;
      return EXPANDED_CHAPTERS.find(
        (ch) =>
          ch.heroine === hid &&
          ch.chapterNum === nextNum &&
          hState.affection >= ch.requiredAffection
      );
    },
    [state.heroines]
  );

  // Start a Date / Story Chapter with a heroine
  const handleEngageHeroine = (hid: HeroineId, locId: LocationId) => {
    if (state.energy <= 0) {
      showToast(
        locale === 'ckb'
          ? '⚡ وزەی ئەمشەوت تەواو بووە! بچۆ سویتی ١٧٠٩ بۆ پشوودان بۆ شەوی داهاتوو.'
          : '⚡ Out of Energy tonight! Visit Suite 1709 to rest until tomorrow night.'
      );
      return;
    }
    audioEngine.init();
    audioEngine.setMood('passionate_strings');
    setSelectedLoc(null);

    const readyChapter = getNextAvailableChapter(hid);
    if (readyChapter) {
      setEncounter({
        title: readyChapter.title,
        heroine: hid,
        chapterToMark: readyChapter.chapterNum,
        beats: readyChapter.introBeats,
        beatIndex: 0,
        choices: readyChapter.choices,
      });
      setScreen('scene');
      return;
    }

    const dyn = enrichDynamicScene(
      hid,
      locId,
      buildDynamicDateScene(hid, locId)
    );
    setEncounter({
      title: {
        ckb: `ژوانی تایبەت لەگەڵ ${HEROINES[hid].name.ckb}`,
        en: `Private Moment with ${HEROINES[hid].name.en}`,
      },
      heroine: hid,
      beats: dyn.beats,
      beatIndex: 0,
      choices: dyn.choices,
    });
    setScreen('scene');
  };

  // Resolve choice inside an encounter
  const applyEncounterChoice = (
    choice: EncounterChoice,
    heartbeatScore: number | null
  ) => {
    if (!encounter) return;
    const hid = encounter.heroine || null;
    let affGain = choice.affectionDelta;
    let desGain = choice.desireDelta;

    // Mood synergy check (inspired by dating-sim-lab!)
    let isCrit = false;
    if (hid) {
      const moodBest = MOOD_META[state.heroines[hid].mood].bestStyle;
      if (choice.style === moodBest) {
        affGain = Math.round(affGain * 1.35);
        desGain = Math.round(desGain * 1.35);
        isCrit = true;
      }
    }

    const wonPassionBonus =
      (heartbeatScore !== null && heartbeatScore >= 70) ||
      (hid ? state.heroines[hid].desire >= 65 : false);

    if (heartbeatScore !== null && heartbeatScore >= 75) {
      affGain += 8;
      desGain += 10;
    }

    advanceTimeAndUpdateHeroine(hid, affGain, desGain, choice.trustDelta, {
      chapterCompleted: encounter.chapterToMark,
      memory: choice.memory,
      spendEnergy: true,
      charmDelta: choice.charmGain || 1,
    });

    fireBurst(isCrit || wonPassionBonus ? 'flame' : 'heart');
    addTrauma(isCrit ? 0.45 : 0.22);
    triggerHaptic(isCrit ? 'large' : 'medium');

    showToast(
      `${isCrit ? '🔥 CRIT SYNERGY! ' : ''}+${affGain} ❤️  +${desGain} 🔥`
    );

    const extraBeats =
      wonPassionBonus && choice.passionBonusBeats
        ? [...choice.followUpBeats, ...choice.passionBonusBeats]
        : choice.followUpBeats;

    setEncounter({
      ...encounter,
      beats: extraBeats,
      beatIndex: 0,
      choices: undefined,
      pendingChoice: undefined,
    });
  };

  const handleSelectSceneChoice = (choice: EncounterChoice) => {
    audioEngine.playTap(true);
    if (choice.triggerHeartbeat && encounter?.heroine) {
      setEncounter({ ...encounter, pendingChoice: choice });
      setHeartbeatTarget(encounter.heroine);
      return;
    }
    applyEncounterChoice(choice, null);
  };

  const handleSceneTap = () => {
    if (!encounter || !activeBeat) return;
    audioEngine.init();

    if (isTyping) {
      setRevealedChars(beatText.length);
      return;
    }

    const isLastBeat = encounter.beatIndex >= encounter.beats.length - 1;
    if (!isLastBeat) {
      audioEngine.playTap(false);
      setEncounter({ ...encounter, beatIndex: encounter.beatIndex + 1 });
      return;
    }

    // Wait for player choice or ending actions
    if (encounter.choices && encounter.choices.length > 0) return;
    if (encounter.ending) return;

    // Return to Hub!
    audioEngine.setMood('midnight_jazz');
    setEncounter(null);
    setScreen('hub');
  };

  // Gift giving (0 Energy! Inspired by breedhaven-university GiftValuesSchema)
  const handleGiveGift = (hid: HeroineId, gift: GiftItem) => {
    const count = state.inventory[gift.id] || 0;
    if (count <= 0) return;

    const prof = HEROINES[hid];
    const isLoved = gift.tags.some((tg) => prof.lovedTags.includes(tg));
    const isDisliked =
      !isLoved && gift.tags.some((tg) => prof.dislikedTags.includes(tg));

    const affDelta = isLoved ? 24 : isDisliked ? -4 : 13;
    const desDelta = isLoved ? 18 : isDisliked ? 0 : 8;
    const reactionText = isLoved
      ? prof.giftReactions.loved
      : isDisliked
      ? prof.giftReactions.disliked
      : prof.giftReactions.liked;

    setState((prev) => {
      const nextInv = { ...prev.inventory, [gift.id]: count - 1 };
      const curH = prev.heroines[hid];
      const nextAff = Math.max(0, curH.affection + affDelta);
      return {
        ...prev,
        inventory: nextInv,
        heroines: {
          ...prev.heroines,
          [hid]: {
            ...curH,
            affection: nextAff,
            desire: Math.min(100, curH.desire + desDelta),
            rank: computeRank(nextAff),
            giftsGiven: curH.giftsGiven + 1,
            mood: isLoved ? 'heated' : curH.mood,
          },
        },
      };
    });

    setGiftTarget(null);
    setSelectedLoc(null);
    fireBurst(isLoved ? 'flame' : 'heart');
    triggerHaptic(isLoved ? 'large' : 'medium');
    showToast(
      isLoved
        ? `💝 LOVED GIFT! +${affDelta} ❤️`
        : `${affDelta >= 0 ? '+' : ''}${affDelta} ❤️`
    );

    setEncounter({
      title: {
        ckb: `پێشکەشکردنی دیاری بۆ ${prof.name.ckb}`,
        en: `Gift for ${prof.name.en}`,
      },
      heroine: hid,
      beats: [
        {
          speaker: hid,
          image: isLoved ? prof.blushArt : prof.avatar,
          camera: isLoved ? 'intimate_zoom' : 'close',
          effect: isLoved ? 'warm_glow' : 'none',
          text: reactionText,
        },
      ],
      beatIndex: 0,
    });
    setScreen('scene');
  };

  // Clue Investigation at Archive
  const handleInvestigateClue = () => {
    if (state.energy <= 0) {
      showToast(
        locale === 'ckb'
          ? '⚡ وزەت نەماوە! لە سویتی ١٧٠٩ پشوو بدە.'
          : '⚡ No Energy left tonight! Rest in Suite 1709.'
      );
      return;
    }
    if (state.rubyClues >= 3) {
      showToast(
        locale === 'ckb'
          ? '✓ هەموو ٣ بەڵگەکەت دۆزیوەتەوە!'
          : '✓ All 3 Ruby Clues already found!'
      );
      return;
    }
    const nextClue = state.rubyClues + 1;
    const reward = nextClue === 1 ? 90 : nextClue === 2 ? 110 : 150;

    setState((prev) => ({
      ...prev,
      energy: prev.energy - 1,
      phase: Math.min(3, prev.phase + 1) as TimePhase,
      rubyClues: nextClue,
      cash: prev.cash + reward,
      wit: prev.wit + 2,
    }));

    setSelectedLoc(null);
    fireBurst('gold');
    setEncounter({
      title: { ckb: 'لێکۆڵینەوە لە نهێنیی یاقووت', en: 'Ruby Vault Investigation' },
      beats: RUBY_CLUE_SCENES[nextClue],
      beatIndex: 0,
    });
    setScreen('scene');
  };

  // Sleep / Advance Night OR Trigger Night 7 Grand Finale!
  const handleRestOrFinale = () => {
    setSelectedLoc(null);
    if (state.night >= 7) {
      // Pick Grand Finale Ending based on Ranks & Affection!
      const h = state.heroines;
      const highRankHeroines = (['layla', 'celine', 'aria'] as HeroineId[]).filter(
        (id) => h[id].affection >= 105
      );

      let chosenEnding: FinaleEnding = FINALE_ENDINGS.end_sweet_spark;
      if (highRankHeroines.length >= 2) {
        chosenEnding = FINALE_ENDINGS.end_trio_crown;
      } else if (
        h.layla.affection >= 105 &&
        h.layla.affection >= h.celine.affection &&
        h.layla.affection >= h.aria.affection
      ) {
        chosenEnding = FINALE_ENDINGS.end_layla_lover;
      } else if (
        h.celine.affection >= 105 &&
        h.celine.affection >= h.aria.affection
      ) {
        chosenEnding = FINALE_ENDINGS.end_celine_lover;
      } else if (h.aria.affection >= 105) {
        chosenEnding = FINALE_ENDINGS.end_aria_lover;
      }

      setMeta((prev) => ({
        unlockedCgs: prev.unlockedCgs.includes(chosenEnding.unlockCg)
          ? prev.unlockedCgs
          : [...prev.unlockedCgs, chosenEnding.unlockCg],
        unlockedEndings: prev.unlockedEndings.includes(chosenEnding.id)
          ? prev.unlockedEndings
          : [...prev.unlockedEndings, chosenEnding.id],
      }));

      audioEngine.setMood('dawn_warmth');
      fireBurst('flame');
      setEncounter({
        title: chosenEnding.badge,
        beats: chosenEnding.beats,
        beatIndex: 0,
        ending: chosenEnding,
      });
      setScreen('scene');
      return;
    }

    const moods: MoodType[] = ['flirty', 'heated', 'vulnerable', 'radiant', 'jealous'];
    const pickMood = (seed: number) => moods[seed % moods.length];

    setState((prev) => {
      const nextN = prev.night + 1;
      return {
        ...prev,
        night: nextN,
        phase: 0,
        energy: 3,
        heroines: {
          layla: { ...prev.heroines.layla, mood: pickMood(nextN + 1) },
          celine: { ...prev.heroines.celine, mood: pickMood(nextN + 3) },
          aria: { ...prev.heroines.aria, mood: pickMood(nextN + 2) },
        },
      };
    });

    triggerHaptic('medium');
    audioEngine.playEffect('warm_glow');
    showToast(
      locale === 'ckb'
        ? `🌙 شەوی ${state.night + 1} دەستی پێ کرد! وزەت پڕ بووەوە (⚡ 3/3)`
        : `🌙 Night ${state.night + 1} Begins! Energy Restored (⚡ 3/3)`
    );
  };

  // Reply to Phone DM Thread
  const handleReplyPhone = (thread: PhoneThread, optIndex: number) => {
    const opt = thread.options[optIndex];
    if (!opt) return;
    triggerHaptic('medium');
    audioEngine.playTap(true);
    fireBurst('heart');

    setState((prev) => {
      const curH = prev.heroines[thread.heroine];
      const nextAff = curH.affection + opt.affectionDelta;
      const prevMsgs = prev.activeReplies[thread.heroine] || [];
      return {
        ...prev,
        completedThreads: [...prev.completedThreads, thread.id],
        activeReplies: {
          ...prev.activeReplies,
          [thread.heroine]: [
            ...prevMsgs,
            ...thread.opening,
            { sender: 'you', text: opt.label },
            ...opt.herReply,
          ],
        },
        heroines: {
          ...prev.heroines,
          [thread.heroine]: {
            ...curH,
            affection: nextAff,
            desire: Math.min(100, curH.desire + opt.desireDelta),
            rank: computeRank(nextAff),
            mood: opt.newMood || curH.mood,
          },
        },
      };
    });

    showToast(`📱 +${opt.affectionDelta} ❤️  +${opt.desireDelta} 🔥`);
  };

  const handleEquipOutfit = (hid: HeroineId, outfitId: string) => {
    triggerHaptic('small');
    audioEngine.playTap(true);
    setEquippedOutfits((prev) => {
      const next = { ...prev, [hid]: outfitId };
      try {
        localStorage.setItem('midnight_velvet_outfits_v23', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    unlockCgId(outfitId);
    showToast(
      locale === 'ckb'
        ? '🔥 جلوبەرگەکەی گۆڕدرا!'
        : '🔥 Outfit updated!'
    );
  };

  const handleInspectRoomSecret = (spot: TowerHotspot) => {
    audioEngine.init();
    audioEngine.setMood('passionate_strings');
    triggerHaptic('medium');
    setSelectedHotspot(null);
    setSelectedLoc(null);
    if (spot.privateOwner) {
      advanceTimeAndUpdateHeroine(spot.privateOwner, 8, 12, 5, {
        spendEnergy: false,
      });
      showToast('🔥 نهێنیی ژوور دۆزرایەوە! +8 ❤️  +12 🔥');
    }
    setEncounter({
      title: spot.secretObject.discoveryTitle,
      heroine: spot.privateOwner,
      beats: spot.secretObject.beats,
      beatIndex: 0,
      choices: spot.secretObject.choices,
    });
    setScreen('scene');
  };

  const handleInspectSpaScene = (spot: TowerHotspot) => {
    if (!spot.spaObject) return;
    audioEngine.init();
    audioEngine.setMood('passionate_strings');
    triggerHaptic('large');
    setSelectedHotspot(null);
    setSelectedLoc(null);
    setSteamBlurLevel(2);
    if (spot.privateOwner) {
      advanceTimeAndUpdateHeroine(spot.privateOwner, 10, 15, 5, {
        spendEnergy: false,
      });
    }
    setEncounter({
      title: spot.spaObject.discoveryTitle,
      heroine: spot.privateOwner,
      beats: spot.spaObject.beats,
      beatIndex: 0,
      choices: spot.spaObject.choices,
    });
    setScreen('scene');
  };

  // Live Free AI Phone Exchange
  const handleLiveAiPhoneExchange = (
    hid: HeroineId,
    userMsg: string,
    herReply: string,
    herSnap?: string
  ) => {
    triggerHaptic('small');
    fireBurst('heart');
    setState((prev) => {
      const curH = prev.heroines[hid];
      const nextAff = curH.affection + 6;
      const prevMsgs = prev.activeReplies[hid] || [];
      return {
        ...prev,
        activeReplies: {
          ...prev.activeReplies,
          [hid]: [
            ...prevMsgs,
            { sender: 'you', text: { ckb: userMsg, en: userMsg } },
            {
              sender: 'her',
              text: { ckb: herReply, en: herReply },
              image: herSnap,
            },
          ],
        },
        heroines: {
          ...prev.heroines,
          [hid]: {
            ...curH,
            affection: nextAff,
            desire: Math.min(100, curH.desire + 8),
            rank: computeRank(nextAff),
          },
        },
      };
    });
    showToast('💬 AI +6 ❤️  +6 🔥');
  };

  // Live Free AI In-Scene Continuation right on the VN Stage!
  const handleContinueSceneWithAi = async (customText?: string) => {
    if (!encounter?.heroine || isSceneAiLoading) return;
    const textToUse = (customText ?? sceneAiDraft).trim();
    if (!textToUse) return;
    setSceneAiDraft('');
    setIsSceneAiLoading(true);
    audioEngine.playTap(true);

    const hid = encounter.heroine;
    const history = encounter.beats.slice(-5).map((b) => ({
      role: (b.speaker === 'you' ? 'user' : 'assistant') as
        | 'user'
        | 'assistant',
      content: b.text[locale],
    }));

    const aiReply = await generateHeroineAiReply({
      heroineId: hid,
      userText: textToUse,
      history,
      state,
      locale,
      contextMode: 'scene',
      outfitId: equippedOutfits[hid],
    });

    advanceTimeAndUpdateHeroine(hid, 7, 9, 4, { spendEnergy: false });
    fireBurst('flame');
    triggerHaptic('medium');
    showToast('🔥 +7 ❤️  +9 🔥');

    const sipanImg =
      SIPAN_OUTFITS.find((s) => s.id === sipanOutfit)?.image ||
      '/assets/sipan_penthouse.jpg';
    const equippedImg = getEquippedOutfitImage(hid, equippedOutfits);
    const newBeats: SceneBeat[] = [
      ...encounter.beats,
      {
        speaker: 'you',
        image: sipanImg,
        camera: 'close',
        text: { ckb: textToUse, en: textToUse },
      },
      {
        speaker: hid,
        image: equippedImg,
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        text: { ckb: aiReply, en: aiReply },
      },
    ];

    setEncounter({
      ...encounter,
      beats: newBeats,
      beatIndex: newBeats.length - 2,
    });
    setIsSceneAiLoading(false);
  };

  const handleBuyGift = (gift: GiftItem) => {
    if (state.cash < gift.price) {
      showToast(
        locale === 'ckb'
          ? '💵 پارەی پێویستت نییە! لە باڕی جاز یان مەلەوانگەکە کار بکە بۆ پەیداکردنی پارە.'
          : '💵 Not enough cash! Play Midnight Mixology at the Lounge or Pool to earn $$!'
      );
      return;
    }
    triggerHaptic('small');
    audioEngine.playTap(true);
    fireBurst('gold');
    setState((prev) => ({
      ...prev,
      cash: prev.cash - gift.price,
      inventory: {
        ...prev.inventory,
        [gift.id]: (prev.inventory[gift.id] || 0) + 1,
      },
    }));
    showToast(
      locale === 'ckb'
        ? `🛍️ کڕدرا: ${gift.name.ckb}`
        : `🛍️ Purchased: ${gift.name.en}`
    );
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audioEngine.setEnabled(next);
  };

  return (
    <div
      className="vn-app-shell"
      style={{
        transform: `translate3d(${shakeOffset.x}px, ${shakeOffset.y}px, 0) rotate(${shakeOffset.rot}deg)`,
      }}
    >
      <ParticleBurstCanvas burstSignal={burst} />

      {bannerToast && <div className="floating-banner-toast">{bannerToast}</div>}

      {/* ==================== SCREEN 1: TITLE ==================== */}
      {screen === 'title' && (
        <div className="title-screen">
          <div
            className="title-bg"
            style={{ backgroundImage: 'url(/assets/cg_sipan_trio.jpg)' }}
          />
          <div className="title-vignette" />
          <AtmosphereCanvas mode="candle_embers" intensity={1.15} />

          <header className="title-topbar">
            <button
              className="pill-btn"
              onClick={() => setLocale((l) => (l === 'ckb' ? 'en' : 'ckb'))}
            >
              <Languages size={16} />
              <span>{locale === 'ckb' ? 'English' : 'کوردی'}</span>
            </button>
            <button className="pill-btn" onClick={toggleSound}>
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </header>

          <motion.div
            className="title-hero-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="velvet-badge">
              <Flame size={13} />
              <span>7 NIGHTS • 3 HEROINES • DATING SIM RPG</span>
            </div>
            <h1 className="main-logo-title">
              {locale === 'ckb' ? 'حەوت شەوی مەخمەلی' : 'Midnight Velvet 2.0'}
            </h1>
            <h2 className="main-logo-sub">
              {locale === 'ckb'
                ? 'ژوان، نهێنی و شەیدایی لە نهۆمی ١٧ و ١٨'
                : 'Seven Nights of Desire, Mystery & Romance'}
            </h2>
            <p className="main-tagline">
              {locale === 'ckb'
                ? '٣ شاجوان (لەیلا، سێلین، ئاریا) • ٦ شوێنی کراوە • چاتی مۆبایل و وێنە • یاریی لێدانی دڵ و دیاری!'
                : '3 Captivating Women • 6 Penthouse Locations • Late-Night Phone DMs • Heartbeat Sync & Gift Affinity!'}
            </p>

            <div className="title-menu-buttons">
              {state.seenIntro && (
                <button className="primary-cta" onClick={continueSavedGame}>
                  <Play size={18} />
                  <span>
                    {locale === 'ckb'
                      ? `بەردەوامبوون (شەوی ${state.night}/7)`
                      : `Continue (Night ${state.night}/7)`}
                  </span>
                </button>
              )}

              <button
                className={state.seenIntro ? 'secondary-cta' : 'primary-cta'}
                onClick={startFreshGame}
              >
                <Sparkles size={17} />
                <span>
                  {locale === 'ckb'
                    ? 'دەستپێکردنی یاریی نوێ'
                    : 'Start New 7-Night Story'}
                </span>
              </button>

              <div className="title-sub-grid">
                <button
                  className="glass-btn"
                  onClick={() => setModal('gallery')}
                >
                  <ImageIcon size={16} />
                  <span>
                    {locale === 'ckb'
                      ? `ئەلبووم (${meta.unlockedCgs.length}/12)`
                      : `Gallery (${meta.unlockedCgs.length}/12)`}
                  </span>
                </button>
                <button
                  className="glass-btn"
                  onClick={() => setModal('dossier')}
                >
                  <Heart size={16} />
                  <span>
                    {locale === 'ckb' ? 'کارەکتەرەکان' : 'Heroines'}
                  </span>
                </button>
                {!Capacitor.isNativePlatform() && (
                  <a
                    className="glass-btn full apk-download-link"
                    href="/Midnight-Velvet.apk"
                    download="Midnight-Velvet.apk"
                  >
                    <Download size={16} />
                    <span>
                      {locale === 'ckb'
                        ? 'دابەزاندنی فایلی APK (ڤێرژنی نوێی ئەندرۆید)'
                        : 'Download Updated Android APK'}
                    </span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ==================== SCREEN 2: PENTHOUSE HUB ==================== */}
      {screen === 'hub' && (
        <div className="hub-screen">
          <div
            className="hub-bg"
            style={{ backgroundImage: 'url(/assets/bg_penthouse.jpg)' }}
          />
          <div className="hub-overlay" />
          <AtmosphereCanvas mode="rain_storm" intensity={0.75} />

          {/* Sleek Compact Estella-Style RPG HUD */}
          <header className="hub-header compact-v26">
            <div className="hub-calendar-row">
              <button
                type="button"
                className="sipan-hud-chip"
                onClick={() => setModal('wardrobe')}
              >
                <img
                  src={
                    SIPAN_OUTFITS.find((s) => s.id === sipanOutfit)?.image ||
                    '/assets/sipan_penthouse.jpg'
                  }
                  alt="Sipan"
                />
                <span>{locale === 'ckb' ? 'سیپان' : 'Sipan'}</span>
              </button>

              <div className="night-badge compact">
                <span>{PHASE_NAMES[state.phase].icon}</span>
                <strong>
                  {locale === 'ckb'
                    ? `شەوی ${state.night}/7`
                    : `Night ${state.night}/7`}
                </strong>
              </div>

              <span className="res-pill energy">⚡ {state.energy}/3</span>
              <span className="res-pill cash">💵 ${state.cash}</span>

              {state.energy === 0 && (
                <button
                  type="button"
                  className="rest-quick-pill"
                  onClick={handleRestOrFinale}
                >
                  🛌 {locale === 'ckb' ? 'شەوی نوێ' : 'Rest'}
                </button>
              )}

              <button
                type="button"
                className="map-toggle-pill"
                onClick={() =>
                  setHubViewMode((m) => (m === 'tower' ? 'cards' : 'tower'))
                }
              >
                {hubViewMode === 'tower'
                  ? locale === 'ckb'
                    ? '📋 لیست'
                    : '📋 List'
                  : locale === 'ckb'
                  ? '🗺️ جیهانی ئازاد'
                  : '🗺️ Open World'}
              </button>

              <div className="hub-top-icons">
                <button
                  className="hud-icon-btn"
                  onClick={() => setLocale((l) => (l === 'ckb' ? 'en' : 'ckb'))}
                >
                  <span className="lang-mini">{locale === 'ckb' ? 'EN' : 'کو'}</span>
                </button>
                <button className="hud-icon-btn" onClick={toggleSound}>
                  {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
                <button
                  className="hud-icon-btn"
                  onClick={() => setScreen('title')}
                >
                  <Home size={14} />
                </button>
              </div>
            </div>
          </header>

          {/* 60fps Open Free-Roam World OR Classic Cards */}
          {hubViewMode === 'tower' ? (
            <FreeRoamWorld
              state={state}
              locale={locale}
              sipanOutfit={sipanOutfit}
              equippedOutfits={equippedOutfits}
              hasStoryReady={(hid) => Boolean(getNextAvailableChapter(hid))}
              onEngageHeroine={handleEngageHeroine}
              onTriggerSecret={handleInspectRoomSecret}
              onTriggerSpa={handleInspectSpaScene}
              onOpenShop={() => setModal('shop')}
              onStartMixology={() => setShowMixology(true)}
            />
          ) : (
          <main className="hub-locations-grid">
            {LOCATIONS.map((location) => {
              const presentGirls = getHeroinesAtLocation(location.id);
              return (
                <motion.div
                  key={location.id}
                  className="loc-card"
                  style={{ backgroundImage: `url(${location.image})` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (location.id === 'boutique') {
                      setModal('shop');
                    } else {
                      setSelectedLoc(location.id);
                    }
                  }}
                >
                  <div className="loc-card-shade" />
                  <div className="loc-card-top">
                    <span className="loc-ico">{location.icon}</span>
                    {presentGirls.length > 0 && (
                      <div className="present-avatars">
                        {presentGirls.map((hid) => {
                          const hasCh = Boolean(getNextAvailableChapter(hid));
                          return (
                            <div key={hid} className="mini-girl-bubble">
                              <img
                                src={HEROINES[hid].avatar}
                                alt={hid}
                                style={{ borderColor: HEROINES[hid].color }}
                              />
                              <span className="bubble-mood">
                                {MOOD_META[state.heroines[hid].mood].icon}
                              </span>
                              {hasCh && <span className="story-star">★</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="loc-card-bottom">
                    <h4>{loc(location.name, locale)}</h4>
                    <p>{loc(location.subtitle, locale)}</p>
                  </div>
                </motion.div>
              );
            })}
          </main>
          )}

          {/* Bottom Dock: Phone DM, Wardrobe, Girls, Boutique, Rest */}
          <nav className="hub-bottom-dock">
            <button
              className="dock-btn"
              onClick={() => setModal('phone')}
            >
              <div className="dock-icon-wrap">
                <MessageCircle size={19} />
                {availableThreads.length > 0 && (
                  <span className="badge-count">{availableThreads.length}</span>
                )}
              </div>
              <span>{locale === 'ckb' ? 'نامەکان' : 'Phone'}</span>
            </button>

            <button
              className="dock-btn"
              onClick={() => setModal('wardrobe')}
            >
              <Flame size={19} />
              <span>{locale === 'ckb' ? 'جلوبەرگ' : 'Outfits'}</span>
            </button>

            <button
              className="dock-btn"
              onClick={() => setModal('dossier')}
            >
              <Heart size={19} />
              <span>{locale === 'ckb' ? 'پەیوەندی' : 'Girls'}</span>
            </button>

            <button
              className="dock-btn"
              onClick={() => setModal('shop')}
            >
              <ShoppingBag size={19} />
              <span>{locale === 'ckb' ? 'فرۆشگا' : 'Gifts'}</span>
            </button>

            <button
              className={`dock-btn highlight ${state.energy === 0 ? 'pulse-cta' : ''}`}
              onClick={handleRestOrFinale}
            >
              <BedDouble size={19} />
              <span>
                {state.night >= 7
                  ? locale === 'ckb'
                    ? 'کۆتایی!'
                    : 'Finale!'
                  : locale === 'ckb'
                  ? 'خەوتن'
                  : 'Next Night'}
              </span>
            </button>
          </nav>

          {/* Location Action Drawer */}
          {selectedLoc && (
            <div
              className="modal-backdrop"
              onClick={() => {
                setSelectedLoc(null);
                setGiftTarget(null);
              }}
            >
              <div
                className="modal-sheet"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>
                    {
                      LOCATIONS.find((l) => l.id === selectedLoc)?.icon
                    }{' '}
                    {loc(
                      LOCATIONS.find((l) => l.id === selectedLoc)!.name,
                      locale
                    )}
                  </h3>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setSelectedLoc(null);
                      setGiftTarget(null);
                    }}
                  >
                    <X size={19} />
                  </button>
                </div>

                <div className="modal-body action-sheet-list">
                  {selectedHotspot && (
                    <div
                      className="room-preview-banner"
                      style={{
                        backgroundImage: `url(${selectedHotspot.roomBg})`,
                      }}
                    >
                      <div className="room-preview-shade">
                        <strong>
                          {selectedHotspot.icon}{' '}
                          {loc(selectedHotspot.title, locale)}
                        </strong>
                        <small>{loc(selectedHotspot.sub, locale)}</small>
                        <button
                          type="button"
                          className="secret-inspect-btn"
                          onClick={() =>
                            handleInspectRoomSecret(selectedHotspot)
                          }
                        >
                          {loc(selectedHotspot.secretObject.label, locale)}
                        </button>
                        {selectedHotspot.spaObject && (
                          <button
                            type="button"
                            className="secret-inspect-btn spa-hot-btn"
                            onClick={() =>
                              handleInspectSpaScene(selectedHotspot)
                            }
                          >
                            {loc(selectedHotspot.spaObject.label, locale)}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Heroines present here (including private room owner) */}
                  {Array.from(
                    new Set([
                      ...(selectedHotspot?.privateOwner
                        ? [selectedHotspot.privateOwner]
                        : []),
                      ...getHeroinesAtLocation(selectedLoc),
                    ])
                  ).map((hid) => {
                    const prof = HEROINES[hid];
                    const hSt = state.heroines[hid];
                    const moodInf = MOOD_META[hSt.mood];
                    const nextCh = getNextAvailableChapter(hid);
                    const eqAvatar = getEquippedOutfitImage(
                      hid,
                      equippedOutfits
                    );

                    return (
                      <div key={hid} className="girl-encounter-box">
                        <div className="girl-box-header">
                          <img src={eqAvatar} alt={hid} />
                          <div className="girl-box-meta">
                            <strong style={{ color: prof.color }}>
                              {loc(prof.name, locale)} • Lv.{hSt.rank}
                            </strong>
                            <span className="mood-hint-line">
                              {moodInf.icon} {loc(moodInf.label, locale)} —{' '}
                              {locale === 'ckb'
                                ? `حەزی لە شێوازی (${
                                    moodInf.bestStyle === 'bold'
                                      ? '🔥 بوێر'
                                      : moodInf.bestStyle === 'tender'
                                      ? '💖 سۆزدار'
                                      : '😏 شۆخی'
                                  })ـە!`
                                : `Craves ${moodInf.bestStyle.toUpperCase()} replies!`}
                            </span>
                          </div>
                        </div>

                        <div className="girl-box-btns">
                          <button
                            className="primary-cta"
                            onClick={() =>
                              handleEngageHeroine(hid, selectedLoc)
                            }
                          >
                            <Flame size={16} />
                            <span>
                              {nextCh
                                ? locale === 'ckb'
                                  ? `★ بەشی ${nextCh.chapterNum}: ${nextCh.title.ckb} (-1 ⚡)`
                                  : `★ Ch.${nextCh.chapterNum}: ${nextCh.title.en} (-1 ⚡)`
                                : locale === 'ckb'
                                ? `ژوانی نزیک لەگەڵ ${prof.name.ckb} (-1 ⚡)`
                                : `Intimate Hangout with ${prof.name.en} (-1 ⚡)`}
                            </span>
                          </button>

                          <button
                            className="secondary-cta"
                            onClick={() =>
                              setGiftTarget(giftTarget === hid ? null : hid)
                            }
                          >
                            <Gift size={15} />
                            <span>
                              {locale === 'ckb'
                                ? 'پێدانی دیاری (بێ وزە)'
                                : 'Give Gift (0 ⚡)'}
                            </span>
                          </button>
                        </div>

                        {giftTarget === hid && (
                          <div className="inline-gift-bag">
                            {GIFTS_CATALOG.filter(
                              (g) => (state.inventory[g.id] || 0) > 0
                            ).length === 0 ? (
                              <p className="empty-bag-msg">
                                {locale === 'ckb'
                                  ? 'جانتاکەت بەتاڵە! لە فرۆشگاکە دیاری بکڕە.'
                                  : 'Your gift bag is empty! Visit the Boutique.'}
                              </p>
                            ) : (
                              GIFTS_CATALOG.filter(
                                (g) => (state.inventory[g.id] || 0) > 0
                              ).map((g) => (
                                <button
                                  key={g.id}
                                  className="bag-gift-chip"
                                  onClick={() => handleGiveGift(hid, g)}
                                >
                                  <span>
                                    {g.icon} {loc(g.name, locale)} (×
                                    {state.inventory[g.id]})
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Location Utility Activities */}
                  {(selectedLoc === 'lounge' || selectedLoc === 'pool') && (
                    <button
                      className="activity-card-btn"
                      onClick={() => {
                        if (state.energy <= 0) {
                          showToast(
                            locale === 'ckb'
                              ? '⚡ وزەت نەماوە! بچۆ بۆ خەوتن.'
                              : '⚡ Out of Energy! Rest in Suite 1709.'
                          );
                          return;
                        }
                        setSelectedLoc(null);
                        setShowMixology(true);
                      }}
                    >
                      <Wine size={18} />
                      <div>
                        <strong>
                          {locale === 'ckb'
                            ? '🍸 یاریی تێکەڵکردنی خواردنەوەی VIP (-1 ⚡)'
                            : '🍸 Play Midnight Mixology Minigame (-1 ⚡)'}
                        </strong>
                        <small>
                          {locale === 'ckb'
                            ? '١١٠$ تا ٢٦٠$ پارە پەیدا بکە بۆ کڕینی دیاریی گرانبەها!'
                            : 'Earn $110–$260 Cash & Charm XP!'}
                        </small>
                      </div>
                    </button>
                  )}

                  {selectedLoc === 'fireplace' && state.rubyClues < 3 && (
                    <button
                      className="activity-card-btn"
                      onClick={handleInvestigateClue}
                    >
                      <Search size={18} />
                      <div>
                        <strong>
                          {locale === 'ckb'
                            ? `🔎 پشکنینی بەڵگەی ملوانکەی یاقووت (${state.rubyClues}/3) (-1 ⚡)`
                            : `🔎 Investigate Ruby Theft Clues (${state.rubyClues}/3) (-1 ⚡)`}
                        </strong>
                        <small>
                          {locale === 'ckb'
                            ? 'دۆزینەوەی ڕاستییەکە + پاداشتی دارایی ($90–$150)'
                            : 'Uncover the culprit & earn consulting bonus cash!'}
                        </small>
                      </div>
                    </button>
                  )}

                  {selectedLoc === 'suite' && (
                    <button
                      className="activity-card-btn rest"
                      onClick={handleRestOrFinale}
                    >
                      <BedDouble size={18} />
                      <div>
                        <strong>
                          {state.night >= 7
                            ? locale === 'ckb'
                              ? '👑 دەستپێکردنی ئاهەنگی شەوی کۆتایی و ئەنجام!'
                              : '👑 Begin Night 7 Grand Finale!'
                            : locale === 'ckb'
                            ? `🌙 پشوودان تا شەوی ${state.night + 1} (پڕکردنەوەی وزە ⚡ 3/3)`
                            : `🌙 Sleep Until Night ${state.night + 1} (Refill ⚡ 3/3)`}
                        </strong>
                        <small>
                          {locale === 'ckb'
                            ? 'شەوی نوێ دەست پێ دەکات و نامەی نوێی مۆبایلت بۆ دێت.'
                            : 'Advances the calendar & unlocks fresh late-night DMs.'}
                        </small>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== SCREEN 3: VISUAL NOVEL SCENE STAGE ==================== */}
      {screen === 'scene' && encounter && activeBeat && (() => {
        const beatHeroine =
          activeBeat.speaker === 'layla' ||
          activeBeat.speaker === 'celine' ||
          activeBeat.speaker === 'aria'
            ? activeBeat.speaker
            : null;
        const resolvedStageImage =
          beatHeroine &&
          (activeBeat.image.endsWith('_normal.jpg') ||
            activeBeat.image.endsWith('_blush.jpg'))
            ? getEquippedOutfitImage(beatHeroine, equippedOutfits)
            : activeBeat.image;
        return (
        <div className="game-stage">
          <AnimatePresence mode="sync">
            <motion.div
              key={resolvedStageImage}
              className={`scene-artwork cam-${activeBeat.camera || 'normal'}`}
              style={{
                backgroundImage: `url(${resolvedStageImage})`,
                filter:
                  steamBlurLevel === 2
                    ? 'blur(13px) brightness(1.06)'
                    : steamBlurLevel === 1
                    ? 'blur(5px) brightness(1.03)'
                    : 'none',
                transition: 'filter 0.45s ease',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
            />
          </AnimatePresence>

          {steamBlurLevel > 0 && (
            <div className="frosted-steam-layer">
              <button
                type="button"
                className="wipe-steam-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  audioEngine.playEffect('heartbeat');
                  fireBurst('flame');
                  setSteamBlurLevel((lv) => Math.max(0, lv - 1));
                }}
              >
                🌫️{' '}
                {locale === 'ckb'
                  ? `سڕینی هەڵم و تەمی سەر شوشەکە (${steamBlurLevel}/2)`
                  : `Wipe Frosted Steam (${steamBlurLevel}/2)`}
              </button>
            </div>
          )}

          <div className="scene-gradient-overlay" onClick={handleSceneTap} />
          <AtmosphereCanvas mode="candle_embers" intensity={0.9} />

          <header className="hud-topbar">
            <div className="chapter-pill">{loc(encounter.title, locale)}</div>
            <div className="hud-actions">
              {!encounter.choices && !encounter.ending && (
                <button
                  className="hud-icon-btn"
                  onClick={() => {
                    if (encounter.ending) return;
                    setEncounter(null);
                    setScreen('hub');
                  }}
                  title="Skip Scene"
                >
                  <FastForward size={15} />
                </button>
              )}
              <button className="hud-icon-btn" onClick={toggleSound}>
                {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              <button
                className="hud-icon-btn"
                onClick={() => setLocale((l) => (l === 'ckb' ? 'en' : 'ckb'))}
              >
                <span className="lang-mini">{locale === 'ckb' ? 'EN' : 'کو'}</span>
              </button>
            </div>
          </header>

          <div className="stage-bottom">
            {/* Encounter Choices */}
            {!isTyping &&
              encounter.beatIndex >= encounter.beats.length - 1 &&
              encounter.choices && (
                <motion.div
                  className="choices-container"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {encounter.choices.map((ch) => {
                    const hMood = encounter.heroine
                      ? state.heroines[encounter.heroine].mood
                      : null;
                    const isBestSynergy =
                      hMood && MOOD_META[hMood].bestStyle === ch.style;

                    return (
                      <button
                        key={ch.id}
                        className="choice-card"
                        onClick={() => handleSelectSceneChoice(ch)}
                      >
                        <div className="choice-main-text">
                          <span>{loc(ch.text, locale)}</span>
                        </div>
                        <div className="choice-meta-tags">
                          {ch.triggerHeartbeat && (
                            <span className="choice-tone-badge pulse">
                              💓{' '}
                              {locale === 'ckb'
                                ? 'یاریی لێدانی دڵ'
                                : 'Heartbeat Sync'}
                            </span>
                          )}
                          {isBestSynergy && (
                            <span className="choice-tone-badge crit">
                              ✨{' '}
                              {locale === 'ckb'
                                ? 'گونجاو لەگەڵ میزاجی ئێستای (x1.35)'
                                : 'Mood Synergy (x1.35)!'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}

            {/* Live AI Scene Continuation Bar at End of Any Heroine Scene */}
            {!isTyping &&
              encounter.beatIndex >= encounter.beats.length - 1 &&
              !encounter.choices &&
              !encounter.ending &&
              encounter.heroine && (
                <div
                  className="scene-ai-live-box"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="scene-ai-chips">
                    <button
                      className="quick-flirt-chip"
                      disabled={isSceneAiLoading}
                      onClick={() =>
                        handleContinueSceneWithAi(
                          locale === 'ckb'
                            ? 'زیاتر لێت نزیک دەبمەوە، کەمەرت دەگرم و بە چرپە لە بن گوێت پێت دەڵێم چەندە تامەزرۆی تۆم ئەمشەو...'
                            : 'I pull you flush into my arms and whisper against your ear how badly I want you tonight…'
                        )
                      }
                    >
                      {locale === 'ckb'
                        ? '🔥 زیاتر لە باوەشی بگرە و بچرپێنە...'
                        : '🔥 Pull her closer & whisper…'}
                    </button>
                    <button
                      className="quick-flirt-chip"
                      disabled={isSceneAiLoading}
                      onClick={() =>
                        handleContinueSceneWithAi(
                          locale === 'ckb'
                            ? 'پەنجەکانم دەخەمە ژێر چەناگەت و ماچێکی گەرم و درێژ لەسەر لێوت دادەنێم...'
                            : 'I tilt your chin up gently and claim a slow, lingering kiss…'
                        )
                      }
                    >
                      {locale === 'ckb'
                        ? '💋 ماچێکی گەرم و درێژ...'
                        : '💋 Steal a lingering kiss…'}
                    </button>
                  </div>
                  <form
                    className="live-chat-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleContinueSceneWithAi();
                    }}
                  >
                    <input
                      type="text"
                      className="live-chat-input"
                      value={sceneAiDraft}
                      disabled={isSceneAiLoading}
                      onChange={(e) => setSceneAiDraft(e.target.value)}
                      placeholder={
                        isSceneAiLoading
                          ? locale === 'ckb'
                            ? 'AI خەریکی درێژەدانە بە دیمەنەکە...'
                            : 'AI is continuing the scene...'
                          : locale === 'ckb'
                          ? 'بە ئازادی بنووسە چی دەڵێیت یان چی دەکەیت (AI)...'
                          : 'Type anything to say or do next (Live AI)...'
                      }
                    />
                    <button
                      type="submit"
                      className="live-send-btn"
                      disabled={isSceneAiLoading || !sceneAiDraft.trim()}
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              )}

            {/* Dialogue Box */}
            <div className="dialogue-panel" onClick={handleSceneTap}>
              <div className="dialogue-top-row">
                <span
                  className="speaker-badge"
                  style={{
                    color: SPEAKER_LABELS[activeBeat.speaker].color,
                    borderColor: `${SPEAKER_LABELS[activeBeat.speaker].color}55`,
                    background: 'rgba(20, 12, 34, 0.72)',
                  }}
                >
                  {activeBeat.speaker === 'you' && (
                    <img
                      src={
                        SIPAN_OUTFITS.find((s) => s.id === sipanOutfit)
                          ?.image || '/assets/sipan_penthouse.jpg'
                      }
                      alt="Sipan"
                      className="sipan-speaker-face"
                    />
                  )}
                  {SPEAKER_LABELS[activeBeat.speaker][locale]}
                </span>
                <span className="beat-progress">
                  {encounter.beatIndex + 1} / {encounter.beats.length}
                </span>
              </div>

              <p className="dialogue-body">
                <span>{beatText.slice(0, revealedChars)}</span>
                <span className="invisible-remainder">
                  {beatText.slice(revealedChars)}
                </span>
              </p>

              {!isTyping &&
                (encounter.beatIndex < encounter.beats.length - 1 ||
                  (!encounter.choices && !encounter.ending)) && (
                  <div className="continue-prompt">
                    <span>
                      {locale === 'ckb'
                        ? 'دەست بدە لە شاشەکە بۆ بەردەوامبوون...'
                        : 'Tap to continue...'}
                    </span>
                    <span className="pulse-dot" />
                  </div>
                )}

              {/* Finale Ending Summary Box */}
              {!isTyping &&
                encounter.beatIndex >= encounter.beats.length - 1 &&
                encounter.ending && (
                  <div
                    className="ending-summary-box"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h4>« {loc(encounter.ending.title, locale)} »</h4>
                    <p>{loc(encounter.ending.summary, locale)}</p>
                    <div className="ending-btn-row">
                      <button
                        className="primary-cta compact"
                        onClick={startFreshGame}
                      >
                        <RotateCcw size={15} />
                        <span>
                          {locale === 'ckb'
                            ? 'یاریی نوێ بۆ کردنەوەی کۆتایی تر'
                            : 'Play Again'}
                        </span>
                      </button>
                      <button
                        className="secondary-cta compact"
                        onClick={() => {
                          setEncounter(null);
                          setScreen('title');
                          setModal('gallery');
                        }}
                      >
                        <ImageIcon size={15} />
                        <span>{locale === 'ckb' ? 'ئەلبووم' : 'Gallery'}</span>
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ==================== MINI-GAME OVERLAYS ==================== */}
      {heartbeatTarget && encounter?.pendingChoice && (
        <HeartbeatMinigame
          heroineName={loc(HEROINES[heartbeatTarget].name, locale)}
          heroineImage={HEROINES[heartbeatTarget].blushArt}
          locale={locale}
          onComplete={(score) => {
            const pending = encounter.pendingChoice!;
            setHeartbeatTarget(null);
            applyEncounterChoice(pending, score);
          }}
        />
      )}

      {showMixology && (
        <MixologyMinigame
          locale={locale}
          onCancel={() => setShowMixology(false)}
          onFinish={(earnedCash, charmBonus) => {
            setShowMixology(false);
            setState((prev) => ({
              ...prev,
              energy: Math.max(0, prev.energy - 1),
              phase: Math.min(3, prev.phase + 1) as TimePhase,
              cash: prev.cash + earnedCash,
              charm: prev.charm + charmBonus,
            }));
            fireBurst('gold');
            showToast(`🍸 +$${earnedCash}  +${charmBonus} ✨ Charm!`);
          }}
        />
      )}

      {/* ==================== PHONE MESSENGER ==================== */}
      {modal === 'phone' && (
        <PhoneOverlay
          state={state}
          availableThreads={availableThreads}
          locale={locale}
          equippedOutfits={equippedOutfits}
          onReplyThread={handleReplyPhone}
          onLiveAiExchange={handleLiveAiPhoneExchange}
          onClose={() => setModal(null)}
        />
      )}

      {/* ==================== WARDROBE / HOT OUTFITS ==================== */}
      {modal === 'wardrobe' && (
        <WardrobeModal
          locale={locale}
          equippedOutfits={equippedOutfits}
          sipanOutfit={sipanOutfit}
          onEquip={handleEquipOutfit}
          onEquipSipan={(sid) => {
            triggerHaptic('small');
            setSipanOutfit(sid);
            try {
              localStorage.setItem('midnight_velvet_sipan_v25', sid);
            } catch {
              // ignore
            }
            showToast(
              locale === 'ckb'
                ? '👑 ستایلی سیپان گۆڕدرا!'
                : '👑 Sipan outfit updated!'
            );
          }}
          onZoom={(img) => setZoomCg(img)}
          onClose={() => setModal(null)}
        />
      )}

      {/* ==================== HEROINES DOSSIER & MEMORIES ==================== */}
      {modal === 'dossier' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {locale === 'ckb'
                  ? '💖 دۆسیەی کارەکتەرەکان و یادگارییەکان'
                  : '💖 Heroine Relationships & Memories'}
              </h3>
              <button className="icon-btn" onClick={() => setModal(null)}>
                <X size={19} />
              </button>
            </div>
            <div className="modal-body dossier-list">
              {(['layla', 'celine', 'aria'] as HeroineId[]).map((hid) => {
                const prof = HEROINES[hid];
                const hSt = state.heroines[hid];
                const nextThresh =
                  RANK_THRESHOLDS[Math.min(4, hSt.rank)] || 155;

                return (
                  <div key={hid} className="dossier-card">
                    <div className="dossier-top">
                      <img src={prof.avatar} alt={hid} />
                      <div>
                        <strong style={{ color: prof.color }}>
                          {loc(prof.name, locale)} • Lv.{hSt.rank} (
                          {loc(RANK_TITLES[hSt.rank], locale)})
                        </strong>
                        <small className="dossier-role">
                          {loc(prof.role, locale)}
                        </small>
                        <div className="dossier-meters">
                          <span>❤️ {hSt.affection}/{nextThresh}</span>
                          <span>🔥 {hSt.desire}%</span>
                          <span>💎 {hSt.trust}%</span>
                          <span>
                            📖 {locale === 'ckb' ? 'بەش:' : 'Ch:'}{' '}
                            {hSt.unlockedChapter}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="dossier-bio">{loc(prof.bio, locale)}</p>
                    {hSt.memories.length > 0 && (
                      <div className="memories-box">
                        <strong>
                          {locale === 'ckb' ? '✨ یادگارییەکان:' : '✨ Memories:'}
                        </strong>
                        <ul>
                          {hSt.memories.map((mem, idx) => (
                            <li key={idx}>{loc(mem, locale)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== BOUTIQUE GIFT SHOP ==================== */}
      {modal === 'shop' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                🛍️{' '}
                {locale === 'ckb'
                  ? `فرۆشگای دیاریی تایبەت (💵 $${state.cash})`
                  : `Midnight Boutique (💵 $${state.cash})`}
              </h3>
              <button className="icon-btn" onClick={() => setModal(null)}>
                <X size={19} />
              </button>
            </div>
            <div className="modal-body shop-grid">
              {GIFTS_CATALOG.map((gift) => (
                <div key={gift.id} className="shop-item-card">
                  <div className="shop-item-head">
                    <span className="shop-ico">{gift.icon}</span>
                    <div>
                      <strong>{loc(gift.name, locale)}</strong>
                      <small className="owned-pill">
                        {locale === 'ckb' ? 'لە جانتادا:' : 'Owned:'}{' '}
                        {state.inventory[gift.id] || 0}
                      </small>
                    </div>
                  </div>
                  <p>{loc(gift.desc, locale)}</p>
                  <button
                    className="mini-btn load"
                    onClick={() => handleBuyGift(gift)}
                  >
                    {locale === 'ckb'
                      ? `کڕین بە $${gift.price}`
                      : `Buy — $${gift.price}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== CG & ENDINGS GALLERY ==================== */}
      {modal === 'gallery' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                🖼️{' '}
                {locale === 'ckb'
                  ? `ئەلبوومی وێنە تایبەتەکان (${meta.unlockedCgs.length}/12)`
                  : `CG & Endings Gallery (${meta.unlockedCgs.length}/12)`}
              </h3>
              <button className="icon-btn" onClick={() => setModal(null)}>
                <X size={19} />
              </button>
            </div>
            <div className="modal-body">
              <div className="cg-grid">
                {GALLERY_CGS.map((cg) => {
                  const unlocked = meta.unlockedCgs.includes(cg.id);
                  return (
                    <div
                      key={cg.id}
                      className={`cg-card ${unlocked ? 'unlocked' : 'locked'}`}
                      onClick={() => unlocked && setZoomCg(cg.image)}
                    >
                      {unlocked ? (
                        <>
                          <img src={cg.image} alt={loc(cg.title, locale)} />
                          <div className="cg-caption">
                            <strong>{loc(cg.title, locale)}</strong>
                          </div>
                        </>
                      ) : (
                        <div className="cg-locked-box">
                          <Lock size={20} />
                          <span>
                            {locale === 'ckb' ? 'داخراوە' : 'Locked CG'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {zoomCg && (
        <div
          className="zoom-lightbox"
          onClick={() => setZoomCg(null)}
        >
          <img src={zoomCg} alt="CG Full" />
        </div>
      )}
    </div>
  );
};

export default App;
