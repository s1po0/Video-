import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { HEROINES, loc, MOOD_META } from '../data/catalog';
import { GameState, HeroineId, Locale, PhoneThread } from '../types/game';
import { generateHeroineAiReply } from '../utils/aiRoleplay';

interface PhoneProps {
  state: GameState;
  availableThreads: PhoneThread[];
  locale: Locale;
  onReplyThread: (thread: PhoneThread, optionIdx: number) => void;
  onLiveAiExchange: (
    heroine: HeroineId,
    userMsg: string,
    herReply: string
  ) => void;
  onClose: () => void;
}

export const PhoneOverlay: React.FC<PhoneProps> = ({
  state,
  availableThreads,
  locale,
  onReplyThread,
  onLiveAiExchange,
  onClose,
}) => {
  const [selectedHeroine, setSelectedHeroine] = useState<HeroineId>('layla');
  const [zoomSnap, setZoomSnap] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const pendingForHeroine = availableThreads.find(
    (th) => th.heroine === selectedHeroine
  );
  const pastMessages = state.activeReplies[selectedHeroine] || [];
  const profile = HEROINES[selectedHeroine];
  const hState = state.heroines[selectedHeroine];
  const moodInfo = MOOD_META[hState.mood];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pastMessages.length, selectedHeroine, isSending]);

  const sendLiveMessage = async (textToSend?: string) => {
    const clean = (textToSend ?? draft).trim();
    if (!clean || isSending) return;
    setDraft('');
    setIsSending(true);

    const history = pastMessages.slice(-8).map((m) => ({
      role: (m.sender === 'you' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: loc(m.text, locale),
    }));

    const reply = await generateHeroineAiReply({
      heroineId: selectedHeroine,
      userText: clean,
      history,
      state,
      locale,
      contextMode: 'phone',
    });

    onLiveAiExchange(selectedHeroine, clean, reply);
    setIsSending(false);
  };

  const quickPrompts =
    locale === 'ckb'
      ? [
          '🔥 ئەمشەو زۆر سەرنجڕاکێشیت، ناتوانم چاوم لەسەرت لابەم...',
          '💋 وەرە بۆ سویتی ١٧٠٩، دەرگاکەم بۆ تۆ بە کراوەیی هێشتووەتەوە...',
          '💖 پێم بڵێ کاتێک دەستت لێ دەدەم هەست بە چی دەکەیت؟',
        ]
      : [
          '🔥 You looked breathtaking tonight… I still can’t stop thinking about you.',
          '💋 Come to Suite 1709—I left the door unlocked just for you.',
          '💖 Tell me honestly… how fast does your heart beat when I get close?',
        ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="phone-frame" onClick={(e) => e.stopPropagation()}>
        <div className="phone-notch-bar">
          <span className="phone-brand">
            <MessageCircle size={15} /> Velvet DM • AI Live
          </span>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="phone-contacts-row">
          {(['layla', 'celine', 'aria'] as HeroineId[]).map((hid) => {
            const hProf = HEROINES[hid];
            const hasUnread = availableThreads.some((th) => th.heroine === hid);
            return (
              <button
                key={hid}
                className={`contact-tab ${selectedHeroine === hid ? 'active' : ''}`}
                onClick={() => setSelectedHeroine(hid)}
              >
                <div className="contact-avatar-wrap">
                  <img src={hProf.avatar} alt={loc(hProf.name, locale)} />
                  {hasUnread && <span className="unread-dot" />}
                </div>
                <span>{loc(hProf.name, locale)}</span>
              </button>
            );
          })}
        </div>

        <div className="phone-chat-subheader">
          <div>
            <strong>{loc(profile.name, locale)}</strong>
            <span className="mood-pill" style={{ color: moodInfo.color }}>
              {moodInfo.icon} {loc(moodInfo.label, locale)}
            </span>
          </div>
          <span className="rel-lv-chip">
            Lv.{hState.rank} • ❤️ {hState.affection} • 🔥 {hState.desire}%
          </span>
        </div>

        <div className="phone-messages-body">
          {pastMessages.length === 0 && !pendingForHeroine && (
            <div className="empty-chat-note">
              {locale === 'ckb'
                ? `✨ زیرەکیی دەستکردی ناوخۆیی (بێ کلیل و بێ سنوور) ئامادەیە! هەر شتێکت دەوێت لە خوارەوە بۆ ${loc(profile.name, locale)} بنووسە!`
                : `✨ Built-in Free AI Roleplay is ready! Type anything below to talk & flirt with ${loc(profile.name, locale)}!`}
            </div>
          )}

          {pastMessages.map((msg, i) => (
            <div
              key={i}
              className={`chat-bubble ${msg.sender === 'you' ? 'you' : 'her'}`}
            >
              {msg.image && (
                <img
                  src={msg.image}
                  alt="snap"
                  className="chat-snap-img"
                  onClick={() => setZoomSnap(msg.image!)}
                />
              )}
              <p>{loc(msg.text, locale)}</p>
            </div>
          ))}

          {pendingForHeroine &&
            pendingForHeroine.opening.map((msg, idx) => (
              <div key={`open-${idx}`} className="chat-bubble her new-pulse">
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="snap"
                    className="chat-snap-img"
                    onClick={() => setZoomSnap(msg.image!)}
                  />
                )}
                <p>{loc(msg.text, locale)}</p>
              </div>
            ))}

          {isSending && (
            <div className="chat-bubble her typing-bubble">
              <p>
                {locale === 'ckb'
                  ? `${loc(profile.name, locale)} خەریکی نووسینی وەڵامێکی درێژ و گەرمە... 💬`
                  : `${loc(profile.name, locale)} is writing a passionate reply... 💬`}
              </p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {pendingForHeroine && (
          <div className="phone-reply-drawer">
            <span className="reply-drawer-label">
              <Sparkles size={13} />{' '}
              {locale === 'ckb'
                ? 'وەڵامی نامە و وێنەکەی بدەرەوە:'
                : 'Reply to her midnight snap:'}
            </span>
            {pendingForHeroine.options.map((opt, idx) => (
              <button
                key={idx}
                className="phone-reply-btn"
                onClick={() => onReplyThread(pendingForHeroine, idx)}
              >
                <Send size={14} />
                <span>{loc(opt.label, locale)}</span>
              </button>
            ))}
          </div>
        )}

        <div className="live-ai-composer">
          <div className="quick-flirt-scroll">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                className="quick-flirt-chip"
                disabled={isSending}
                onClick={() => sendLiveMessage(qp)}
              >
                {qp}
              </button>
            ))}
          </div>
          <form
            className="live-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              sendLiveMessage();
            }}
          >
            <input
              type="text"
              className="live-chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                locale === 'ckb'
                  ? `قسەی دڵت بە ئازادی بۆ ${loc(profile.name, locale)} بنووسە...`
                  : `Say anything to ${loc(profile.name, locale)}...`
              }
            />
            <button
              type="submit"
              className="live-send-btn"
              disabled={isSending || !draft.trim()}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {zoomSnap && (
        <div
          className="zoom-lightbox"
          onClick={(e) => {
            e.stopPropagation();
            setZoomSnap(null);
          }}
        >
          <img src={zoomSnap} alt="Snap" />
        </div>
      )}
    </div>
  );
};
