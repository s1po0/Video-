import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import {
  BookOpen,
  Download,
  FastForward,
  Flame,
  Heart,
  Home,
  Image as ImageIcon,
  Languages,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Volume2,
  VolumeX,
  Wand2,
  Lock,
} from 'lucide-react';
import { AtmosphereCanvas } from './components/AtmosphereCanvas';
import {
  BacklogModal,
  GalleryModal,
  SaveLoadModal,
  StatsModal,
  StudioModal,
} from './components/Modals';
import { START_NODE_ID, STORY_NODES } from './data/storyData';
import { SPEAKER_META, t, UI_TEXT } from './data/uiStrings';
import {
  BacklogEntry,
  ChoiceOption,
  Locale,
  NumericVarKey,
  PersistentData,
  SaveSlotData,
  StoryNode,
  StoryVars,
} from './types/story';
import { audioEngine } from './utils/audioEngine';
import { DEFAULT_VARS, evaluateConditions, resolveNodeId } from './utils/storyEngine';

const PERSIST_KEY = 'midnight_velvet_persistent_v1';
const SAVES_KEY = 'midnight_velvet_saves_v1';

const INITIAL_PERSISTENT: PersistentData = {
  seenNodes: [],
  unlockedCgs: ['cover_keyart'],
  unlockedEndings: [],
};

interface StatToast {
  id: number;
  label: string;
  color: string;
}

export const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>('ckb');
  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const [nodeId, setNodeId] = useState<string>(START_NODE_ID);
  const [customNode, setCustomNode] = useState<StoryNode | null>(null);
  const [vars, setVars] = useState<StoryVars>(DEFAULT_VARS);
  const [history, setHistory] = useState<BacklogEntry[]>([]);

  const [persistent, setPersistent] = useState<PersistentData>(() => {
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      return raw ? { ...INITIAL_PERSISTENT, ...JSON.parse(raw) } : INITIAL_PERSISTENT;
    } catch {
      return INITIAL_PERSISTENT;
    }
  });

  const [saves, setSaves] = useState<Record<string, SaveSlotData>>(() => {
    try {
      const raw = localStorage.getItem(SAVES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [autoMode, setAutoMode] = useState<boolean>(false);
  const [skipMode, setSkipMode] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [showHints, setShowHints] = useState<boolean>(true);
  const [activeModal, setActiveModal] = useState<
    null | 'stats' | 'backlog' | 'saves' | 'gallery' | 'studio'
  >(null);
  const [flashEffect, setFlashEffect] = useState<'none' | 'lightning' | 'heartbeat' | 'warm_glow'>(
    'none'
  );
  const [toasts, setToasts] = useState<StatToast[]>([]);
  const toastCounter = useRef(0);

  // Sync HTML dir attribute for crisp Kurdish RTL vs English LTR layout
  useEffect(() => {
    document.documentElement.dir = locale === 'ckb' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(persistent));
    } catch {
      // ignore storage quota errors
    }
  }, [persistent]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
    } catch {
      // ignore storage quota errors
    }
  }, [saves]);

  const currentNode: StoryNode = useMemo(() => {
    if (customNode && nodeId === 'custom_preview') return customNode;
    return STORY_NODES[nodeId] || STORY_NODES[START_NODE_ID];
  }, [customNode, nodeId]);

  // Compose full line including reactive payoff addons from earlier flags
  const fullDisplayText = useMemo(() => {
    let baseCkb = currentNode.text.ckb;
    let baseEn = currentNode.text.en;
    if (currentNode.reactiveAddons) {
      for (const addon of currentNode.reactiveAddons) {
        if (vars[addon.flag]) {
          baseCkb += ' ' + addon.text.ckb;
          baseEn += ' ' + addon.text.en;
        }
      }
    }
    return { ckb: baseCkb, en: baseEn };
  }, [currentNode, vars]);

  const activeLine = fullDisplayText[locale];
  const isTyping = revealedCount < activeLine.length;

  // Save helper
  const writeSaveSlot = useCallback(
    (
      slotId: string,
      targetNode: StoryNode,
      targetVars: StoryVars,
      targetHistory: BacklogEntry[]
    ) => {
      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const entry: SaveSlotData = {
        slotId,
        savedAt: nowStr,
        nodeId: targetNode.id,
        chapter: targetNode.chapter,
        chapterTitle: targetNode.chapterTitle,
        previewText: {
          ckb: targetNode.text.ckb.slice(0, 68) + '...',
          en: targetNode.text.en.slice(0, 68) + '...',
        },
        image: targetNode.image,
        vars: targetVars,
        history: targetHistory.slice(-80),
      };
      setSaves((prev) => ({ ...prev, [slotId]: entry }));
    },
    []
  );

  // Trigger audio, visual effects, unlocks, and autosaves whenever entering a node
  useEffect(() => {
    if (screen !== 'game') return;
    setRevealedCount(0);

    audioEngine.setMood(currentNode.music);
    if (currentNode.effect && currentNode.effect !== 'none') {
      audioEngine.playEffect(currentNode.effect);
      if (
        currentNode.effect === 'lightning' ||
        currentNode.effect === 'heartbeat' ||
        currentNode.effect === 'warm_glow'
      ) {
        setFlashEffect(currentNode.effect);
        const timer = window.setTimeout(() => setFlashEffect('none'), 1200);
        return () => window.clearTimeout(timer);
      }
    }

    setPersistent((prev) => {
      const seenNodes = prev.seenNodes.includes(currentNode.id)
        ? prev.seenNodes
        : [...prev.seenNodes, currentNode.id];
      const unlockedCgs =
        currentNode.unlockCg && !prev.unlockedCgs.includes(currentNode.unlockCg)
          ? [...prev.unlockedCgs, currentNode.unlockCg]
          : prev.unlockedCgs;
      const unlockedEndings =
        currentNode.ending && !prev.unlockedEndings.includes(currentNode.ending.id)
          ? [...prev.unlockedEndings, currentNode.ending.id]
          : prev.unlockedEndings;
      return { ...prev, seenNodes, unlockedCgs, unlockedEndings };
    });
  }, [currentNode, screen]);

  // Typewriter reveal (Pattern 1: reveals visible slice while hidden remainder preserves layout)
  useEffect(() => {
    if (screen !== 'game') return;
    if (revealedCount >= activeLine.length) return;

    const speedMs = skipMode ? 4 : 20;
    const step = skipMode ? 8 : 2;
    const timer = window.setTimeout(() => {
      setRevealedCount((c) => Math.min(activeLine.length, c + step));
    }, speedMs);

    return () => window.clearTimeout(timer);
  }, [activeLine.length, revealedCount, screen, skipMode]);

  const goToNode = useCallback(
    (nextRawId: string, updatedVars: StoryVars, prevNode: StoryNode) => {
      const resolvedId = resolveNodeId(nextRawId, STORY_NODES, updatedVars);
      const resolvedNode = STORY_NODES[resolvedId] || STORY_NODES[START_NODE_ID];

      const nextHistory: BacklogEntry[] = [
        ...history.slice(-120),
        {
          nodeId: prevNode.id,
          speaker: prevNode.speaker,
          text: prevNode.text,
        },
      ];
      setHistory(nextHistory);
      setVars(updatedVars);
      setNodeId(resolvedId);

      // Autosave at choices and crossroads
      writeSaveSlot('autosave', resolvedNode, updatedVars, nextHistory);
      if (resolvedId === 'c3_crossroads') {
        writeSaveSlot('crossroads', resolvedNode, updatedVars, nextHistory);
      }
    },
    [history, writeSaveSlot]
  );

  // Auto-forward & Skip logic (pauses automatically at choices and endings!)
  useEffect(() => {
    if (screen !== 'game' || activeModal) return;
    if (isTyping) return;
    if (currentNode.choices || currentNode.ending || !currentNode.next) {
      if (skipMode) setSkipMode(false);
      return;
    }

    if (skipMode) {
      const tmr = window.setTimeout(() => {
        goToNode(currentNode.next!, vars, currentNode);
      }, 140);
      return () => window.clearTimeout(tmr);
    }

    if (autoMode) {
      const readDelay = Math.max(1800, Math.min(4800, activeLine.length * 36));
      const tmr = window.setTimeout(() => {
        goToNode(currentNode.next!, vars, currentNode);
      }, readDelay);
      return () => window.clearTimeout(tmr);
    }
  }, [
    activeLine.length,
    activeModal,
    autoMode,
    currentNode,
    goToNode,
    isTyping,
    screen,
    skipMode,
    vars,
  ]);

  const handleAdvance = () => {
    audioEngine.init();
    if (isTyping) {
      setRevealedCount(activeLine.length);
      return;
    }
    if (currentNode.choices || currentNode.ending) return;
    if (currentNode.next) {
      audioEngine.playTap(false);
      goToNode(currentNode.next, vars, currentNode);
    }
  };

  const pushStatToasts = (effects?: Partial<Record<NumericVarKey, number>>) => {
    if (!effects) return;
    const labels: Record<NumericVarKey, { name: string; color: string }> = {
      layla_affection: {
        name: locale === 'ckb' ? '❤️ لەیلا' : '❤️ Layla',
        color: '#34d399',
      },
      celine_affection: {
        name: locale === 'ckb' ? '💜 سێلین' : '💜 Celine',
        color: '#f472b6',
      },
      chemistry: {
        name: locale === 'ckb' ? '🔥 گەرمی' : '🔥 Chemistry',
        color: '#fb923c',
      },
      trust: {
        name: locale === 'ckb' ? '💎 متمانە' : '💎 Trust',
        color: '#60a5fa',
      },
      boldness: {
        name: locale === 'ckb' ? '🌙 بوێری' : '🌙 Boldness',
        color: '#fbbf24',
      },
    };

    const batch: StatToast[] = [];
    (Object.keys(effects) as NumericVarKey[]).forEach((k) => {
      const delta = effects[k];
      if (delta && delta > 0) {
        toastCounter.current += 1;
        batch.push({
          id: toastCounter.current,
          label: `+${delta} ${labels[k].name}`,
          color: labels[k].color,
        });
      }
    });
    if (batch.length > 0) {
      setToasts((prev) => [...prev, ...batch]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => !batch.some((b) => b.id === item.id)));
      }, 2400);
    }
  };

  const handlePickChoice = (choice: ChoiceOption) => {
    audioEngine.init();
    const allowed = evaluateConditions(choice.conditions, vars);
    if (!allowed) return;

    audioEngine.playTap(true);
    const updated: StoryVars = { ...vars };
    if (choice.effects) {
      (Object.keys(choice.effects) as NumericVarKey[]).forEach((key) => {
        updated[key] = (updated[key] || 0) + (choice.effects?.[key] || 0);
      });
    }
    if (choice.flags) {
      Object.assign(updated, choice.flags);
    }
    pushStatToasts(choice.effects);
    goToNode(choice.to, updated, currentNode);
  };

  const startNewGame = () => {
    audioEngine.init();
    audioEngine.playTap(true);
    setCustomNode(null);
    setVars(DEFAULT_VARS);
    setHistory([]);
    setNodeId(START_NODE_ID);
    setScreen('game');
  };

  const handleLoadSlot = (slot: SaveSlotData) => {
    audioEngine.init();
    setCustomNode(null);
    setVars(slot.vars);
    setHistory(slot.history || []);
    setNodeId(slot.nodeId);
    setActiveModal(null);
    setScreen('game');
  };

  const toggleAudio = () => {
    const next = !soundOn;
    setSoundOn(next);
    audioEngine.setEnabled(next);
  };

  const speakerInfo = SPEAKER_META[currentNode.speaker];

  return (
    <div className={`vn-root ${flashEffect !== 'none' ? `fx-${flashEffect}` : ''}`}>
      {/* ==================== TITLE SCREEN ==================== */}
      {screen === 'title' ? (
        <div className="title-screen">
          <div
            className="title-bg"
            style={{ backgroundImage: 'url(/assets/cover_keyart.jpg)' }}
          />
          <div className="title-vignette" />
          <AtmosphereCanvas mode="candle_embers" intensity={1.1} />

          <header className="title-topbar">
            <button
              className="pill-btn"
              onClick={() => setLocale((l) => (l === 'ckb' ? 'en' : 'ckb'))}
            >
              <Languages size={16} />
              <span>{locale === 'ckb' ? 'English' : 'کوردی'}</span>
            </button>
            <button className="pill-btn" onClick={toggleAudio}>
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </header>

          <motion.div
            className="title-hero-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="velvet-badge">
              <Flame size={14} />
              <span>ROMANTIC THRILLER • INTERACTIVE NOVEL</span>
            </div>
            <h1 className="main-logo-title">{t(UI_TEXT.gameTitle, locale)}</h1>
            <h2 className="main-logo-sub">{t(UI_TEXT.gameSubtitle, locale)}</h2>
            <p className="main-tagline">{t(UI_TEXT.tagline, locale)}</p>

            <div className="title-menu-buttons">
              <button className="primary-cta" onClick={startNewGame}>
                <Play size={18} />
                <span>{t(UI_TEXT.newGame, locale)}</span>
              </button>

              {saves.autosave && (
                <button
                  className="secondary-cta"
                  onClick={() => handleLoadSlot(saves.autosave)}
                >
                  <RotateCcw size={17} />
                  <span>{t(UI_TEXT.continueGame, locale)}</span>
                </button>
              )}

              <div className="title-sub-grid">
                <button
                  className="glass-btn"
                  onClick={() => setActiveModal('gallery')}
                >
                  <ImageIcon size={16} />
                  <span>
                    {t(UI_TEXT.gallery, locale)} ({persistent.unlockedEndings.length}/5)
                  </span>
                </button>
                <button className="glass-btn" onClick={() => setActiveModal('saves')}>
                  <Save size={16} />
                  <span>{t(UI_TEXT.saves, locale)}</span>
                </button>
                <button className="glass-btn full" onClick={() => setActiveModal('studio')}>
                  <Wand2 size={16} />
                  <span>{t(UI_TEXT.studio, locale)}</span>
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
                        ? 'دابەزاندنی فایلی APK (بۆ ئەندرۆید)'
                        : 'Download Android APK'}
                    </span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        /* ==================== IN-GAME STAGE ==================== */
        <div className="game-stage">
          <AnimatePresence mode="sync">
            <motion.div
              key={currentNode.image}
              className={`scene-artwork cam-${currentNode.camera || 'normal'}`}
              style={{ backgroundImage: `url(${currentNode.image})` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
            />
          </AnimatePresence>

          <div className="scene-gradient-overlay" onClick={handleAdvance} />
          <AtmosphereCanvas mode={currentNode.atmosphere} />

          {/* Top Mobile-First HUD */}
          <header className="hud-topbar">
            <div className="hud-left">
              <button
                className="hud-chip chemistry-chip"
                onClick={() => setActiveModal('stats')}
              >
                <span className="mini-stat emerald">
                  <Heart size={13} /> {vars.layla_affection}
                </span>
                <span className="mini-stat rose">
                  <Heart size={13} /> {vars.celine_affection}
                </span>
                <span className="mini-stat amber">
                  <Flame size={13} /> {vars.chemistry}
                </span>
              </button>
            </div>

            <div className="hud-actions">
              <button
                className={`hud-icon-btn ${autoMode ? 'active' : ''}`}
                onClick={() => setAutoMode((a) => !a)}
                title={t(UI_TEXT.auto, locale)}
              >
                <Play size={15} />
              </button>
              <button
                className={`hud-icon-btn ${skipMode ? 'active' : ''}`}
                onClick={() => setSkipMode((s) => !s)}
                title={t(UI_TEXT.skip, locale)}
              >
                <FastForward size={15} />
              </button>
              <button
                className="hud-icon-btn"
                onClick={() => setActiveModal('backlog')}
                title={t(UI_TEXT.backlog, locale)}
              >
                <BookOpen size={15} />
              </button>
              <button
                className="hud-icon-btn"
                onClick={() => setActiveModal('saves')}
                title={t(UI_TEXT.saves, locale)}
              >
                <Save size={15} />
              </button>
              <button
                className="hud-icon-btn"
                onClick={() => setActiveModal('gallery')}
                title={t(UI_TEXT.gallery, locale)}
              >
                <ImageIcon size={15} />
              </button>
              <button className="hud-icon-btn" onClick={toggleAudio}>
                {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              <button
                className="hud-icon-btn"
                onClick={() => setLocale((l) => (l === 'ckb' ? 'en' : 'ckb'))}
              >
                <span className="lang-mini">{locale === 'ckb' ? 'EN' : 'کو'}</span>
              </button>
              <button className="hud-icon-btn" onClick={() => setScreen('title')}>
                <Home size={15} />
              </button>
            </div>
          </header>

          {/* Chapter Ribbon */}
          <div className="chapter-pill">{t(currentNode.chapterTitle, locale)}</div>

          {/* Floating Stat Toasts */}
          <div className="toast-stack">
            <AnimatePresence>
              {toasts.map((item) => (
                <motion.div
                  key={item.id}
                  className="stat-toast"
                  style={{ borderColor: item.color, color: item.color }}
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  {item.label}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Bottom Interactive Panel: Choices, Ending Card, or Dialogue Box */}
          <div className="stage-bottom">
            {/* Choice Overlay */}
            {!isTyping && currentNode.choices && (
              <motion.div
                className="choices-container"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {currentNode.choices.map((choice) => {
                  const unlocked = evaluateConditions(choice.conditions, vars);
                  return (
                    <button
                      key={choice.id}
                      className={`choice-card ${unlocked ? '' : 'locked'}`}
                      onClick={() => handlePickChoice(choice)}
                      disabled={!unlocked}
                    >
                      <div className="choice-main-text">
                        {!unlocked && <Lock size={15} className="inline-lock" />}
                        <span>{t(choice.text, locale)}</span>
                      </div>
                      {showHints && choice.toneTag && unlocked && (
                        <span className="choice-tone-badge">
                          {t(choice.toneTag, locale)}
                        </span>
                      )}
                      {!unlocked && choice.lockedHint && (
                        <span className="choice-locked-hint">
                          {t(choice.lockedHint, locale)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* Dialogue Box */}
            <div className="dialogue-panel" onClick={handleAdvance}>
              <div className="dialogue-top-row">
                <span
                  className="speaker-badge"
                  style={{
                    color: speakerInfo.color,
                    background: speakerInfo.badgeBg,
                    borderColor: `${speakerInfo.color}44`,
                  }}
                >
                  {t(speakerInfo.name, locale)}
                </span>
                {currentNode.ending && (
                  <span className="ending-ribbon">
                    <Sparkles size={13} /> {t(currentNode.ending.badge, locale)}
                  </span>
                )}
              </div>

              {/* Anti-jump Typewriter Text */}
              <p className="dialogue-body">
                <span>{activeLine.slice(0, revealedCount)}</span>
                <span className="invisible-remainder">
                  {activeLine.slice(revealedCount)}
                </span>
              </p>

              {!isTyping && !currentNode.choices && !currentNode.ending && (
                <div className="continue-prompt">
                  <span>{t(UI_TEXT.tapToContinue, locale)}</span>
                  <span className="pulse-dot" />
                </div>
              )}

              {/* Ending Celebration Footer */}
              {!isTyping && currentNode.ending && (
                <motion.div
                  className="ending-summary-box"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4>« {t(currentNode.ending.title, locale)} »</h4>
                  <p>{t(currentNode.ending.summary, locale)}</p>
                  <div className="ending-btn-row">
                    {saves.crossroads && (
                      <button
                        className="primary-cta compact"
                        onClick={() => handleLoadSlot(saves.crossroads)}
                      >
                        <RotateCcw size={15} />
                        <span>{t(UI_TEXT.loadLastChoice, locale)}</span>
                      </button>
                    )}
                    <button
                      className="secondary-cta compact"
                      onClick={() => setActiveModal('gallery')}
                    >
                      <ImageIcon size={15} />
                      <span>{t(UI_TEXT.gallery, locale)}</span>
                    </button>
                    <button
                      className="secondary-cta compact"
                      onClick={startNewGame}
                    >
                      <Play size={15} />
                      <span>{t(UI_TEXT.playAgain, locale)}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}
      {activeModal === 'stats' && (
        <StatsModal
          vars={vars}
          locale={locale}
          showHints={showHints}
          onToggleHints={() => setShowHints((h) => !h)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'backlog' && (
        <BacklogModal
          entries={history}
          locale={locale}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'saves' && (
        <SaveLoadModal
          slots={saves}
          canSave={screen === 'game'}
          locale={locale}
          onSave={(slotId) => writeSaveSlot(slotId, currentNode, vars, history)}
          onLoad={handleLoadSlot}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'gallery' && (
        <GalleryModal
          persistent={persistent}
          locale={locale}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'studio' && (
        <StudioModal
          locale={locale}
          onPlayCustomScene={(node) => {
            setCustomNode(node);
            setNodeId('custom_preview');
            setActiveModal(null);
            setScreen('game');
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export default App;
