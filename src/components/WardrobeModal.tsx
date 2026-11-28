import React, { useState } from 'react';
import { Check, Flame, X } from 'lucide-react';
import { HEROINES, loc } from '../data/catalog';
import { HEROINE_OUTFITS, SIPAN_OUTFITS } from '../data/outfits';
import { HeroineId, Locale } from '../types/game';

interface WardrobeModalProps {
  locale: Locale;
  equippedOutfits: Record<HeroineId, string>;
  sipanOutfit: string;
  onEquip: (hid: HeroineId, outfitId: string) => void;
  onEquipSipan: (outfitId: string) => void;
  onZoom: (img: string) => void;
  onClose: () => void;
}

export const WardrobeModal: React.FC<WardrobeModalProps> = ({
  locale,
  equippedOutfits,
  sipanOutfit,
  onEquip,
  onEquipSipan,
  onZoom,
  onClose,
}) => {
  const [tab, setTab] = useState<'sipan' | HeroineId>('sipan');

  const items =
    tab === 'sipan'
      ? SIPAN_OUTFITS.map((s) => ({
          id: s.id,
          name: s.name,
          tag: s.tag,
          image: s.image,
          isEquipped: sipanOutfit === s.id,
          equip: () => onEquipSipan(s.id),
        }))
      : HEROINE_OUTFITS[tab].map((o) => ({
          id: o.id,
          name: o.name,
          tag: o.tag,
          image: o.image,
          isEquipped: equippedOutfits[tab] === o.id,
          equip: () => onEquip(tab, o.id),
        }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet tall" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Flame size={17} />{' '}
            {locale === 'ckb'
              ? 'ستایلی سیپان و جلوبەرگە گەرمەکان'
              : 'Sipan & Heroines Wardrobe'}
          </h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <div className="wardrobe-tabs">
          <button
            type="button"
            className={`wardrobe-tab-btn ${tab === 'sipan' ? 'active' : ''}`}
            onClick={() => setTab('sipan')}
          >
            👑 {locale === 'ckb' ? 'سیپان' : 'Sipan'}
          </button>
          {(['layla', 'celine', 'aria'] as HeroineId[]).map((hid) => (
            <button
              key={hid}
              type="button"
              className={`wardrobe-tab-btn ${tab === hid ? 'active' : ''}`}
              onClick={() => setTab(hid)}
            >
              {loc(HEROINES[hid].name, locale)}
            </button>
          ))}
        </div>

        <div className="modal-body wardrobe-grid">
          {items.map((item) => (
            <div
              key={item.id}
              className={`wardrobe-card ${item.isEquipped ? 'equipped' : ''}`}
            >
              <div
                className="wardrobe-art"
                style={{ backgroundImage: `url(${item.image})` }}
                onClick={() => onZoom(item.image)}
              >
                <span className="wardrobe-tag-pill">
                  {loc(item.tag, locale)}
                </span>
              </div>
              <div className="wardrobe-card-foot">
                <strong>{loc(item.name, locale)}</strong>
                <button
                  type="button"
                  className={item.isEquipped ? 'secondary-cta' : 'primary-cta'}
                  onClick={item.equip}
                >
                  {item.isEquipped ? (
                    <>
                      <Check size={14} />{' '}
                      <span>{locale === 'ckb' ? 'لەبەریەتی' : 'Equipped'}</span>
                    </>
                  ) : (
                    <span>{locale === 'ckb' ? 'لەبەرکردن' : 'Wear'}</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
