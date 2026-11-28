import React, { useState } from 'react';
import { X, MessageCircle, Send, Sparkles } from 'lucide-react';
import { HEROINES, loc, MOOD_META } from '../data/catalog';
import {
  GameState,
  HeroineId,
  Locale,
  PhoneMessage,
  PhoneThread,
} from '../types/game';

export const PhoneOverlay: React.FC<{
  state: GameState;
  availableThreads: PhoneThread[];
  locale: Locale;
  onReplyThread: (thread: PhoneThread, optionIndex: number) => void;
  onClose: () => void;
}> = ({ state, availableThreads, locale, onReplyThread, onClose }) => {
  const [selectedHeroine, setSelectedHeroine] = useState<HeroineId>(() => {
    if (availableThreads.length > 0) return availableThreads[0].heroine;
    return 'layla';
  });
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  const heroineIds: HeroineId[] = ['layla', 'celine', 'aria'];
  const activeThread = availableThreads.find((th) => th.heroine === selectedHeroine);
  const pastMessages: PhoneMessage[] = state.activeReplies[selectedHeroine] || [];
  const hProfile = HEROINES[selectedHeroine];
  const hState = state.heroines[selectedHeroine];
  const moodInfo = MOOD_META[hState.mood];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="phone-frame" onClick={(e) => e.stopPropagation()}>
        <div className="phone-notch-bar">
          <span className="phone-brand">
            <MessageCircle size={15} /> Velvet DM
          </span>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Contact Switcher */}
        <div className="phone-contacts-row">
          {heroineIds.map((hid) => {
            const prof = HEROINES[hid];
            const unread = availableThreads.some((t) => t.heroine === hid);
            return (
              <button
                key={hid}
                className={`contact-tab ${selectedHeroine === hid ? 'active' : ''}`}
                onClick={() => setSelectedHeroine(hid)}
              >
                <div className="contact-avatar-wrap">
                  <img src={prof.avatar} alt={loc(prof.name, locale)} />
                  {unread && <span className="unread-dot" />}
                </div>
                <span>{loc(prof.name, locale)}</span>
              </button>
            );
          })}
        </div>

        {/* Active Contact Mood Header */}
        <div className="phone-chat-subheader">
          <div>
            <strong style={{ color: hProfile.color }}>{loc(hProfile.name, locale)}</strong>
            <small className="mood-pill" style={{ color: moodInfo.color }}>
              {moodInfo.icon} {loc(moodInfo.label, locale)}
            </small>
          </div>
          <span className="rel-lv-chip">
            Lv.{hState.rank} • ❤️ {hState.affection}
          </span>
        </div>

        {/* Messages Feed */}
        <div className="phone-messages-body">
          {pastMessages.length === 0 && !activeThread && (
            <p className="empty-chat-note">
              {locale === 'ckb'
                ? 'لە ئێستادا هیچ نامەیەکی نوێ نییە. بچۆ بۆ ژوان لە شوێنەکان بۆ کردنەوەی نامەی درەنگانی شەو!'
                : 'No new messages right now. Spend time together in the hotel to trigger late-night DMs!'}
            </p>
          )}

          {pastMessages.map((m, idx) => (
            <div key={`past-${idx}`} className={`chat-bubble ${m.sender}`}>
              {m.image && (
                <img
                  src={m.image}
                  alt="Snap"
                  className="chat-snap-img"
                  onClick={() => setZoomPhoto(m.image!)}
                />
              )}
              <p>{loc(m.text, locale)}</p>
            </div>
          ))}

          {activeThread &&
            activeThread.opening.map((m, idx) => (
              <div key={`open-${idx}`} className={`chat-bubble ${m.sender} fresh`}>
                {m.image && (
                  <img
                    src={m.image}
                    alt="Snap"
                    className="chat-snap-img"
                    onClick={() => setZoomPhoto(m.image!)}
                  />
                )}
                <p>{loc(m.text, locale)}</p>
              </div>
            ))}
        </div>

        {/* Reply Choices */}
        {activeThread ? (
          <div className="phone-reply-drawer">
            <div className="reply-drawer-label">
              <Sparkles size={13} />{' '}
              {locale === 'ckb'
                ? 'شێوازی وەڵامدانەوەکەت هەڵبژێرە (بێ بەکارهێنانی وزە):'
                : 'Choose your reply tone (0 Energy):'}
            </div>
            {activeThread.options.map((opt, idx) => (
              <button
                key={idx}
                className="phone-reply-btn"
                onClick={() => onReplyThread(activeThread, idx)}
              >
                <Send size={14} />
                <span>{loc(opt.label, locale)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="phone-footer-idle">
            {locale === 'ckb' ? '✓ هەموو نامەکانی خوێندرایەوە' : '✓ All caught up'}
          </div>
        )}

        {zoomPhoto && (
          <div className="zoom-lightbox" onClick={() => setZoomPhoto(null)}>
            <img src={zoomPhoto} alt="Snap Zoom" />
          </div>
        )}
      </div>
    </div>
  );
};
