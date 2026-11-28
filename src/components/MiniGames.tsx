import React, { useEffect, useRef, useState } from 'react';
import { Flame, Heart, Sparkles, Wine } from 'lucide-react';
import { Locale } from '../types/game';
import { audioEngine } from '../utils/audioEngine';
import { triggerHaptic } from './JuiceLayer';

/**
 * MINI-GAME 1: Heartbeat Sync (هاوسەنگکردنی لێدانی دڵ)
 * Rhythmic pulse ring: tap inside the sweet spot 4 times to drive Tension -> 100%!
 */
export const HeartbeatMinigame: React.FC<{
  heroineName: string;
  heroineImage: string;
  locale: Locale;
  onComplete: (scorePct: number) => void;
}> = ({ heroineName, heroineImage, locale, onComplete }) => {
  const [round, setRound] = useState(1);
  const [radius, setRadius] = useState(100); // shrinks 100 -> 20, sweet spot is 38..58
  const [tension, setTension] = useState(20);
  const [feedback, setFeedback] = useState<string>('');
  const dirRef = useRef(-1);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const speed = 78 + round * 14;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setRadius((r) => {
        let next = r + dirRef.current * speed * dt;
        if (next <= 22) {
          next = 22;
          dirRef.current = 1;
        } else if (next >= 100) {
          next = 100;
          dirRef.current = -1;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [round]);

  const handleBeatTap = () => {
    const diff = Math.abs(radius - 48);
    let gain = 10;
    if (diff <= 13) {
      gain = 24;
      triggerHaptic('large');
      audioEngine.playEffect('heartbeat');
      setFeedback(locale === 'ckb' ? '🔥 نایاب! لێدانی دڵ هاوتا بوو!' : '🔥 PERFECT PULSE!');
    } else if (diff <= 24) {
      gain = 16;
      triggerHaptic('medium');
      audioEngine.playTap(true);
      setFeedback(locale === 'ckb' ? '💖 نزیک و گەرم!' : '💖 Warm Touch!');
    } else {
      gain = 7;
      triggerHaptic('small');
      audioEngine.playTap(false);
      setFeedback(locale === 'ckb' ? '✨ پەلەت کرد!' : '✨ Too fast!');
    }

    const nextTension = Math.min(100, tension + gain);
    setTension(nextTension);

    if (round >= 4) {
      window.setTimeout(() => onComplete(nextTension), 550);
    } else {
      setRound((r) => r + 1);
    }
  };

  return (
    <div className="minigame-overlay">
      <div
        className="minigame-card heartbeat-theme"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(16,8,26,0.72), rgba(16,8,26,0.95)), url(${heroineImage})`,
        }}
      >
        <div className="mg-badge">
          <Heart size={14} />{' '}
          {locale === 'ckb'
            ? `هاوسەنگکردنی لێدانی دڵ • ${heroineName}`
            : `Heartbeat Sync • ${heroineName}`}
        </div>
        <h3>
          {locale === 'ckb'
            ? 'کاتێک بازنە گەشەکە دەگاتە سەر بازنە زێڕینەکە، دەستی لێ بدە!'
            : 'Tap right as the glowing pulse hits the golden ring!'}
        </h3>

        <div className="pulse-arena" onClick={handleBeatTap}>
          <div className="target-ring" />
          <div
            className="moving-ring"
            style={{
              width: `${radius * 1.9}px`,
              height: `${radius * 1.9}px`,
            }}
          />
          <div className="center-heart">💓</div>
        </div>

        <div className="mg-feedback">{feedback || `${round} / 4`}</div>

        <div className="tension-bar-wrap">
          <div className="tension-label-row">
            <span>
              <Flame size={14} />{' '}
              {locale === 'ckb' ? 'ئاستی گەرمی و کشش' : 'Passion Fever'}
            </span>
            <strong>{tension}%</strong>
          </div>
          <div className="stat-track">
            <div
              className="stat-fill"
              style={{
                width: `${tension}%`,
                background: 'linear-gradient(90deg, #f43f5e, #f59e0b)',
              }}
            />
          </div>
          <small className="mg-hint">
            {locale === 'ckb'
              ? 'گەیشتن بە ٧٠٪+ دیمەنی تایبەت و ماچی گەرم دەکاتەوە!'
              : 'Reach 70%+ to unlock the Passionate Bonus Scene!'}
          </small>
        </div>
      </div>
    </div>
  );
};

/**
 * MINI-GAME 2: Midnight Mixology (ئامادەکردنی خواردنەوەی تایبەت)
 * Craft a 3-note drink at the Velvet Lounge / Pool Bar to earn Cash ($) & Charm!
 */
interface NoteItem {
  id: string;
  icon: string;
  name: { ckb: string; en: string };
  trait: 'sweet' | 'spiced' | 'floral' | 'bold';
}

const NOTES: NoteItem[] = [
  { id: 'pom', icon: '🍷', name: { ckb: 'شەربەتی هەنار', en: 'Ruby Pomegranate' }, trait: 'sweet' },
  { id: 'cin', icon: '🔥', name: { ckb: 'دارچینی گەرم', en: 'Warm Cinnamon' }, trait: 'spiced' },
  { id: 'rose', icon: '🌹', name: { ckb: 'گوڵاو و ڤانێلا', en: 'Velvet Rose Mist' }, trait: 'floral' },
  { id: 'esp', icon: '☕', name: { ckb: 'ئێسپرێسۆی تاڵ', en: 'Dark Espresso' }, trait: 'bold' },
];

export const MixologyMinigame: React.FC<{
  locale: Locale;
  onFinish: (earnedCash: number, charmBonus: number) => void;
  onCancel: () => void;
}> = ({ locale, onFinish, onCancel }) => {
  const [target] = useState<'sweet' | 'spiced' | 'floral' | 'bold'>(() => {
    const arr: ('sweet' | 'spiced' | 'floral' | 'bold')[] = ['sweet', 'spiced', 'floral', 'bold'];
    return arr[Math.floor(Math.random() * arr.length)];
  });
  const [picked, setPicked] = useState<NoteItem[]>([]);

  const orderDesc: Record<typeof target, { ckb: string; en: string }> = {
    sweet: {
      ckb: 'داواکاریی میوانی VIP: «شتێکی شیرین و سوور وەک یاقووتم دەوێت لەگەڵ بۆنێکی نەرم!»',
      en: 'VIP Order: “Make me something ruby-sweet with a delicate finish!”',
    },
    spiced: {
      ckb: 'داواکاریی میوانی VIP: «زریانەکە ساردە — خواردنەوەیەکی تووند و گەرمم بۆ تێکەڵ بکە!»',
      en: 'VIP Order: “The rain is freezing—mix me something fiery and spiced!”',
    },
    floral: {
      ckb: 'داواکاریی میوانی VIP: «خواردنەوەیەکی ڕۆمانسی بە بۆنی گوڵ و ڤانێلا!»',
      en: 'VIP Order: “Something deeply romantic with floral vanilla notes!”',
    },
    bold: {
      ckb: 'داواکاریی میوانی VIP: «نیوەشەوە — تامێکی قورس و تاڵم دەوێت تا بەیانی بێدارم بهێڵێتەوە!»',
      en: 'VIP Order: “It’s past midnight—give me something dark, rich, and bold!”',
    },
  };

  const addNote = (n: NoteItem) => {
    if (picked.length >= 3) return;
    triggerHaptic('small');
    audioEngine.playTap(true);
    const next = [...picked, n];
    setPicked(next);

    if (next.length === 3) {
      const matches = next.filter((x) => x.trait === target).length;
      const cash = 110 + matches * 50;
      const charm = 2 + matches;
      window.setTimeout(() => {
        triggerHaptic('large');
        audioEngine.playEffect('warm_glow');
        onFinish(cash, charm);
      }, 480);
    }
  };

  return (
    <div className="minigame-overlay">
      <div className="minigame-card mix-theme">
        <div className="mg-badge">
          <Wine size={14} />{' '}
          {locale === 'ckb' ? 'میکسۆلۆجیی نیوەشەو (+پارە و کاریزما)' : 'Midnight Mixology (+Cash & Charm)'}
        </div>
        <p className="vip-order-box">{orderDesc[target][locale]}</p>

        <div className="shaker-slots">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className={`shaker-slot ${picked[idx] ? 'filled' : ''}`}>
              {picked[idx] ? (
                <>
                  <span className="slot-ico">{picked[idx].icon}</span>
                  <small>{picked[idx].name[locale]}</small>
                </>
              ) : (
                <span>?</span>
              )}
            </div>
          ))}
        </div>

        <div className="notes-grid">
          {NOTES.map((n) => (
            <button key={n.id} className="note-btn" onClick={() => addNote(n)}>
              <span className="note-ico">{n.icon}</span>
              <span>{n.name[locale]}</span>
            </button>
          ))}
        </div>

        <button className="secondary-action-btn" style={{ marginTop: 12 }} onClick={onCancel}>
          <Sparkles size={14} /> {locale === 'ckb' ? 'گەڕانەوە' : 'Cancel'}
        </button>
      </div>
    </div>
  );
};
