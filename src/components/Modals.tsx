import React, { useState } from 'react';
import {
  X,
  Heart,
  Flame,
  ShieldCheck,
  Sparkles,
  Lock,
  Save,
  FolderOpen,
  Upload,
  Play,
  Download,
} from 'lucide-react';
import {
  BacklogEntry,
  Locale,
  PersistentData,
  SaveSlotData,
  SpeakerId,
  StoryNode,
  StoryVars,
} from '../types/story';
import { ALL_ENDINGS } from '../data/storyData';
import { GALLERY_ITEMS, SPEAKER_META, t, UI_TEXT } from '../data/uiStrings';

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({ title, onClose, children }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

export const StatsModal: React.FC<{
  vars: StoryVars;
  locale: Locale;
  showHints: boolean;
  onToggleHints: () => void;
  onClose: () => void;
}> = ({ vars, locale, showHints, onToggleHints, onClose }) => {
  const meters = [
    {
      label: t(UI_TEXT.laylaStat, locale),
      val: vars.layla_affection,
      max: 8,
      color: '#10b981',
      icon: <Heart size={16} color="#10b981" />,
    },
    {
      label: t(UI_TEXT.celineStat, locale),
      val: vars.celine_affection,
      max: 8,
      color: '#ec4899',
      icon: <Heart size={16} color="#ec4899" />,
    },
    {
      label: t(UI_TEXT.chemistryStat, locale),
      val: vars.chemistry,
      max: 8,
      color: '#f97316',
      icon: <Flame size={16} color="#f97316" />,
    },
    {
      label: t(UI_TEXT.trustStat, locale),
      val: vars.trust,
      max: 8,
      color: '#60a5fa',
      icon: <ShieldCheck size={16} color="#60a5fa" />,
    },
    {
      label: t(UI_TEXT.boldnessStat, locale),
      val: vars.boldness,
      max: 8,
      color: '#fbbf24',
      icon: <Sparkles size={16} color="#fbbf24" />,
    },
  ];

  return (
    <ModalShell title={t(UI_TEXT.stats, locale)} onClose={onClose}>
      <div className="stats-list">
        {meters.map((m) => (
          <div key={m.label} className="stat-row">
            <div className="stat-row-top">
              <span className="stat-label">
                {m.icon} {m.label}
              </span>
              <span className="stat-num">{m.val}</span>
            </div>
            <div className="stat-track">
              <div
                className="stat-fill"
                style={{
                  width: `${Math.min(100, (m.val / m.max) * 100)}%`,
                  background: m.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <button className="secondary-action-btn" onClick={onToggleHints}>
          {showHints ? t(UI_TEXT.hintsOn, locale) : t(UI_TEXT.hintsOff, locale)}
        </button>
      </div>
    </ModalShell>
  );
};

export const BacklogModal: React.FC<{
  entries: BacklogEntry[];
  locale: Locale;
  onClose: () => void;
}> = ({ entries, locale, onClose }) => (
  <ModalShell title={t(UI_TEXT.backlog, locale)} onClose={onClose}>
    <div className="backlog-list">
      {entries.length === 0 && (
        <p className="muted-center">...</p>
      )}
      {entries.map((entry, idx) => {
        const meta = SPEAKER_META[entry.speaker];
        return (
          <div key={`${entry.nodeId}-${idx}`} className="backlog-item">
            <span className="backlog-speaker" style={{ color: meta.color }}>
              {t(meta.name, locale)}
            </span>
            <p className="backlog-text">{t(entry.text, locale)}</p>
          </div>
        );
      })}
    </div>
  </ModalShell>
);

export const SaveLoadModal: React.FC<{
  slots: Record<string, SaveSlotData>;
  canSave: boolean;
  locale: Locale;
  onSave: (slotId: string) => void;
  onLoad: (slot: SaveSlotData) => void;
  onClose: () => void;
}> = ({ slots, canSave, locale, onSave, onLoad, onClose }) => {
  const slotIds = ['autosave', 'crossroads', 'slot_1', 'slot_2', 'slot_3', 'slot_4'];

  return (
    <ModalShell title={t(UI_TEXT.saves, locale)} onClose={onClose}>
      <div className="save-grid">
        {slotIds.map((id, i) => {
          const data = slots[id];
          const isAuto = id === 'autosave' || id === 'crossroads';
          const title =
            id === 'autosave'
              ? t(UI_TEXT.autosaveLabel, locale)
              : id === 'crossroads'
              ? locale === 'ckb'
                ? 'خاڵی یەکلاکەرەوە (بەشی ٣)'
                : 'Crossroads Checkpoint'
              : `${t(UI_TEXT.slotLabel, locale)} ${i - 1}`;

          return (
            <div key={id} className="save-card">
              <div
                className="save-thumb"
                style={{
                  backgroundImage: data ? `url(${data.image})` : 'none',
                }}
              >
                {!data && <span className="empty-badge">{t(UI_TEXT.emptySlot, locale)}</span>}
              </div>
              <div className="save-info">
                <div className="save-title-row">
                  <strong>{title}</strong>
                  {data && <span className="save-date">{data.savedAt}</span>}
                </div>
                {data && (
                  <>
                    <div className="save-chapter">{t(data.chapterTitle, locale)}</div>
                    <p className="save-preview">{t(data.previewText, locale)}</p>
                  </>
                )}
                <div className="save-btn-row">
                  {!isAuto && canSave && (
                    <button className="mini-btn save" onClick={() => onSave(id)}>
                      <Save size={14} /> {t(UI_TEXT.saveBtn, locale)}
                    </button>
                  )}
                  {data && (
                    <button className="mini-btn load" onClick={() => onLoad(data)}>
                      <FolderOpen size={14} /> {t(UI_TEXT.loadBtn, locale)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
};

export const GalleryModal: React.FC<{
  persistent: PersistentData;
  locale: Locale;
  onClose: () => void;
}> = ({ persistent, locale, onClose }) => {
  const [tab, setTab] = useState<'cg' | 'endings'>('cg');
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  return (
    <ModalShell title={t(UI_TEXT.gallery, locale)} onClose={onClose}>
      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === 'cg' ? 'active' : ''}`}
          onClick={() => setTab('cg')}
        >
          {t(UI_TEXT.cgTab, locale)} ({persistent.unlockedCgs.length}/8)
        </button>
        <button
          className={`tab-btn ${tab === 'endings' ? 'active' : ''}`}
          onClick={() => setTab('endings')}
        >
          {t(UI_TEXT.endingsTab, locale)} ({persistent.unlockedEndings.length}/5)
        </button>
      </div>

      {tab === 'cg' ? (
        <div className="cg-grid">
          {GALLERY_ITEMS.map((item) => {
            const unlocked = persistent.unlockedCgs.includes(item.id);
            return (
              <div
                key={item.id}
                className={`cg-card ${unlocked ? 'unlocked' : 'locked'}`}
                onClick={() => unlocked && setZoomImg(item.image)}
              >
                {unlocked ? (
                  <>
                    <img src={item.image} alt={t(item.title, locale)} />
                    <div className="cg-caption">
                      <strong>{t(item.title, locale)}</strong>
                      <span>{t(item.caption, locale)}</span>
                    </div>
                  </>
                ) : (
                  <div className="cg-locked-box">
                    <Lock size={22} />
                    <span>{t(UI_TEXT.lockedCg, locale)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="endings-list">
          {ALL_ENDINGS.map((end) => {
            const unlocked = persistent.unlockedEndings.includes(end.id);
            return (
              <div
                key={end.id}
                className={`ending-item ${unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="ending-badge-row">
                  <span className="ending-num">#{end.number}</span>
                  <strong>
                    {unlocked
                      ? t(end.title, locale)
                      : locale === 'ckb'
                      ? 'کۆتایی نەدۆزراوە'
                      : 'Undiscovered Ending'}
                  </strong>
                </div>
                <p>
                  {unlocked
                    ? t(end.summary, locale)
                    : locale === 'ckb'
                    ? 'ڕێڕەو و هەڵبژاردنی جیاواز تاقی بکەرەوە بۆ کردنەوەی ئەم کۆتاییە.'
                    : 'Explore different choices and character routes to unlock this ending.'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {zoomImg && (
        <div className="zoom-lightbox" onClick={() => setZoomImg(null)}>
          <img src={zoomImg} alt="CG Fullscreen" />
        </div>
      )}
    </ModalShell>
  );
};

export const StudioModal: React.FC<{
  locale: Locale;
  onPlayCustomScene: (node: StoryNode) => void;
  onClose: () => void;
}> = ({ locale, onPlayCustomScene, onClose }) => {
  const [speaker, setSpeaker] = useState<SpeakerId>('layla');
  const [dialogue, setDialogue] = useState(
    locale === 'ckb'
      ? 'ئەم دیمەنەم ڕاستەوخۆ لەسەر مۆبایلەکەم دروست کردووە...'
      : 'I created this custom romantic scene right from my phone...'
  );
  const [imageUrl, setImageUrl] = useState('/assets/layla_blush.jpg');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const buildCustomNode = (): StoryNode => ({
    id: 'custom_preview',
    chapter: 99,
    chapterTitle: { ckb: 'دیمەنی تایبەتی ستۆدیۆ', en: 'Custom Studio Scene' },
    speaker,
    image: imageUrl,
    camera: 'close',
    atmosphere: 'candle_embers',
    music: 'passionate_strings',
    effect: 'heartbeat',
    text: { ckb: dialogue, en: dialogue },
    next: 'p_01',
  });

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(buildCustomNode(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-scene.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ModalShell title={t(UI_TEXT.studioTitle, locale)} onClose={onClose}>
      <p className="studio-desc">{t(UI_TEXT.studioDesc, locale)}</p>
      <div className="studio-form">
        <label>
          {locale === 'ckb' ? 'هەڵبژاردنی قسەکەر:' : 'Speaker:'}
          <select
            value={speaker}
            onChange={(e) => setSpeaker(e.target.value as SpeakerId)}
          >
            <option value="layla">{locale === 'ckb' ? 'لەیلا (Layla)' : 'Layla'}</option>
            <option value="celine">{locale === 'ckb' ? 'سێلین (Celine)' : 'Celine'}</option>
            <option value="you">{locale === 'ckb' ? 'تۆ (You)' : 'You'}</option>
            <option value="narrator">{locale === 'ckb' ? 'گێڕەرەوە' : 'Narrator'}</option>
          </select>
        </label>

        <label className="upload-btn-label">
          <Upload size={16} />
          <span>
            {locale === 'ckb'
              ? 'بارکردنی وێنە لە مۆبایلەکەتەوە'
              : 'Upload Image from Phone Gallery'}
          </span>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
        </label>

        <div className="studio-preset-row">
          {[
            '/assets/layla_blush.jpg',
            '/assets/celine_blush.jpg',
            '/assets/cg_layla_ending.jpg',
            '/assets/cg_celine_ending.jpg',
          ].map((src) => (
            <img
              key={src}
              src={src}
              alt="Preset"
              className={imageUrl === src ? 'selected' : ''}
              onClick={() => setImageUrl(src)}
            />
          ))}
        </div>

        <label>
          {locale === 'ckb' ? 'دەقی دیالۆگ:' : 'Dialogue Text:'}
          <textarea
            rows={3}
            value={dialogue}
            onChange={(e) => setDialogue(e.target.value)}
          />
        </label>

        <div className="studio-actions">
          <button
            className="primary-cta"
            onClick={() => onPlayCustomScene(buildCustomNode())}
          >
            <Play size={16} />{' '}
            {locale === 'ckb' ? 'تاقیکردنەوەی دیمەنەکە' : 'Play Custom Scene'}
          </button>
          <button className="secondary-action-btn" onClick={handleExportJson}>
            <Download size={16} /> JSON
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
