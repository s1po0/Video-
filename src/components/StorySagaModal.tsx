import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Compass, HelpCircle, Search, Sparkles, X } from 'lucide-react';
import { FAIR_PLAY_CLUES, STORY_SAGA_CHAPTERS } from '../data/storySagaPart3';
import type { SagaChoice } from '../data/storySagaTypes';
import type { Locale } from '../types/game';

interface StorySagaModalProps {
  open: boolean;
  locale: Locale;
  currentChapter: number;
  unlockedChapters: number[];
  unlockedClues: string[];
  debunkedClues: string[];
  onClose: () => void;
  onSelectChapter: (num: number) => void;
  onChooseOption: (chapterNum: number, choice: SagaChoice) => void;
  onTeleportToLocation?: (locId: string) => void;
}

export const StorySagaModal: React.FC<StorySagaModalProps> = ({
  open,
  locale,
  currentChapter,
  unlockedChapters,
  unlockedClues,
  debunkedClues,
  onClose,
  onSelectChapter,
  onChooseOption,
  onTeleportToLocation,
}) => {
  const [tab, setTab] = useState<'story' | 'clues' | 'chapters'>('story');
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);
  if (!open) return null;

  const isKu = locale === 'ckb';
  const chapter =
    STORY_SAGA_CHAPTERS.find((c) => c.number === currentChapter) || STORY_SAGA_CHAPTERS[0];

  const handleChoice = (ch: SagaChoice) => {
    setLastOutcome(isKu ? ch.consequenceText.ku : ch.consequenceText.en);
    onChooseOption(chapter.number, ch);
  };

  return (
    <div
      dir={isKu ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-amber-400/40 bg-slate-950/95 text-amber-50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-amber-950/80 via-slate-900 to-fuchsia-950/70 border-b border-amber-400/25">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-amber-200">
                {isKu
                  ? '📖 داستانی قووڵی شاری مەخمەلی (١٢ بەش — Story-Skills)'
                  : '📖 Midnight Velvet 12-Chapter Saga & Clue Ledger'}
              </h2>
              <p className="text-[11px] text-amber-200/70">
                {isKu
                  ? `بەشی ${chapter.number} لە ١٢ • هێڵی دراماتیکی: ${chapter.beat}`
                  : `Chapter ${chapter.number}/12 • Beat: ${chapter.beat}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTab('story')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                tab === 'story' ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-amber-100'
              }`}
            >
              {isKu ? '📖 خوێندنەوە' : '📖 Read'}
            </button>
            <button
              onClick={() => setTab('clues')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${
                tab === 'clues' ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-emerald-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              {isKu ? `بەڵگەکان (${unlockedClues.length}/6)` : `Clues (${unlockedClues.length}/6)`}
            </button>
            <button
              onClick={() => setTab('chapters')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                tab === 'chapters' ? 'bg-fuchsia-400 text-slate-950' : 'bg-white/10 text-fuchsia-200'
              }`}
            >
              {isKu ? '🗂️ بەشەکان' : '🗂️ Chapters'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-rose-500/30 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'story' && (
            <>
              {lastOutcome && (
                <div className="rounded-xl border border-emerald-400/40 bg-emerald-950/50 px-3.5 py-2.5 text-xs sm:text-sm text-emerald-100 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>{lastOutcome}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-start">
                <div className="relative rounded-xl overflow-hidden border border-amber-300/30 bg-slate-900 aspect-[3/4] max-h-64 mx-auto w-44 md:w-full">
                  <img
                    src={chapter.bg}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-45"
                  />
                  <img
                    src={chapter.portrait}
                    alt=""
                    className="relative z-10 w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 text-center">
                    <div className="text-xs font-bold text-amber-200">
                      {isKu ? chapter.speakerName.ku : chapter.speakerName.en}
                    </div>
                    <div className="text-[10px] text-sky-200">
                      {isKu ? chapter.locationLabel.ku : chapter.locationLabel.en}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-amber-300">
                      {isKu ? chapter.title.ku : chapter.title.en}
                    </h3>
                    {onTeleportToLocation && (
                      <button
                        onClick={() => {
                          onTeleportToLocation(chapter.locationId);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-200 text-xs font-bold flex items-center gap-1 hover:bg-sky-500/30"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        {isKu ? 'بڕۆ بۆ شوێنەکە لە 3D' : 'Visit in 3D World'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 rounded-xl bg-slate-900/85 border border-white/10 p-3.5 text-sm sm:text-[15px] leading-7 text-slate-100">
                    {(isKu ? chapter.paragraphs.ku : chapter.paragraphs.en).map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  {chapter.sequelDilemma && (
                    <div className="rounded-xl border border-fuchsia-400/35 bg-fuchsia-950/35 px-3.5 py-2.5 text-xs sm:text-sm text-fuchsia-100">
                      <span className="font-bold text-fuchsia-300">
                        {isKu ? '⚖️ دووڕیانی چارەنووسساز: ' : '⚖️ Dilemma: '}
                      </span>
                      {isKu ? chapter.sequelDilemma.ku : chapter.sequelDilemma.en}
                    </div>
                  )}

                  {chapter.choices.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-300/80">
                        {isKu ? 'بڕیاری سیپان هەڵبژێرە:' : 'Choose Sipan’s Action:'}
                      </div>
                      {chapter.choices.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => handleChoice(ch)}
                          className="w-full text-start px-4 py-3 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 to-fuchsia-500/15 hover:from-amber-500/30 hover:to-fuchsia-500/30 transition text-xs sm:text-sm font-bold text-amber-50 shadow"
                        >
                          ✦ {isKu ? ch.text.ku : ch.text.en}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-300/50 bg-amber-500/15 p-3 text-center space-y-2">
                      <div className="text-sm font-extrabold text-amber-200">
                        {isKu ? '🏆 گەیشتیتە کۆتایی ئەم ڕێڕەوە!' : '🏆 Finale Reached!'}
                      </div>
                      <button
                        onClick={() => {
                          setLastOutcome(null);
                          onSelectChapter(9);
                        }}
                        className="px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold"
                      >
                        {isKu ? 'گەڕانەوە بۆ بەشی ٩ (تاقیکردنەوەی ڕێگەکەی تر)' : 'Replay from Chapter 9'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'clues' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FAIR_PLAY_CLUES.map((clue) => {
                const found = unlockedClues.includes(clue.id);
                const debunked = debunkedClues.includes(clue.id);
                const paidOff = unlockedChapters.includes(10);
                return (
                  <div
                    key={clue.id}
                    className={`rounded-xl border p-3 space-y-1.5 ${
                      found
                        ? clue.redHerring && debunked
                          ? 'border-rose-400/40 bg-rose-950/30'
                          : 'border-emerald-400/40 bg-emerald-950/25'
                        : 'border-white/10 bg-slate-900/60 opacity-65'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-amber-200">
                        {found
                          ? isKu
                            ? clue.title.ku
                            : clue.title.en
                          : isKu
                          ? `🔒 بەڵگەی نهێنی (بەشی ${clue.plantedChapter})`
                          : `🔒 Locked Clue (Ch ${clue.plantedChapter})`}
                      </span>
                      {found ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </div>
                    {found && (
                      <>
                        <p className="text-xs text-slate-200 leading-5">
                          {isKu ? clue.summary.ku : clue.summary.en}
                        </p>
                        {(paidOff || (clue.redHerring && debunked)) && (
                          <p className="text-[11px] font-semibold text-amber-300 border-t border-white/10 pt-1.5">
                            💡 {isKu ? clue.revealedTruth.ku : clue.revealedTruth.en}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'chapters' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STORY_SAGA_CHAPTERS.map((c) => {
                const unlocked = unlockedChapters.includes(c.number) || c.number === 1;
                return (
                  <button
                    key={c.id}
                    disabled={!unlocked}
                    onClick={() => {
                      setLastOutcome(null);
                      onSelectChapter(c.number);
                      setTab('story');
                    }}
                    className={`text-start p-3 rounded-xl border transition ${
                      c.number === currentChapter
                        ? 'border-amber-400 bg-amber-500/20'
                        : unlocked
                        ? 'border-white/15 bg-slate-900 hover:border-amber-300/40'
                        : 'border-white/5 bg-slate-950/60 opacity-45 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-amber-200">
                      {unlocked ? '📖 ' : '🔒 '}
                      {isKu ? c.title.ku : c.title.en}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isKu ? c.locationLabel.ku : c.locationLabel.en} • {c.beat}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
