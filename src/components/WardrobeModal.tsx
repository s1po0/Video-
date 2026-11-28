import React, { useState } from 'react';
import { Check, Flame, X } from 'lucide-react';
import { HEROINES, loc } from '../data/catalog';
import { HEROINE_OUTFITS } from '../data/outfits';
import { HeroineId, Locale } from '../types/game';

interface WardrobeModalProps {
  locale: Locale;
  equippedOutfits: Record<HeroineId, string>;
  onEquip: (hid: HeroineId, outfitId: string) => void;
  onZoom: (img: string) => void;
  onClose: () => void;
}

export const WardrobeModal: React.FC<WardrobeModalProps> = ({
  locale,
  equippedOutfits,
  onEquip,
  onZoom,
  onClose,
}) => {
  const [tab, setTab] = useState<HeroineId>('layla');
  const outfits = HEROINE_OUTFITS[tab];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet tall" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Flame size={17} />{' '}
            {locale === 'ckb'
              ? 'ژووری جلوبەرگە گەرمەکان (١٢ ستایل)'
              : 'Midnight Wardrobe (12 Outfits)'}
          </h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <div className="wardrobe-tabs">
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
          {outfits.map((outfit) => {
            const isEquipped = equippedOutfits[tab] === outfit.id;
            return (
              <div
                key={outfit.id}
                className={`wardrobe-card ${isEquipped ? 'equipped' : ''}`}
              >
                <div
                  className="wardrobe-art"
                  style={{ backgroundImage: `url(${outfit.image})` }}
                  onClick={() => onZoom(outfit.image)}
                >
                  <span className="wardrobe-tag-pill">
                    {loc(outfit.tag, locale)}
                  </span>
                </div>
                <div className="wardrobe-card-foot">
                  <strong>{loc(outfit.name, locale)}</strong>
                  <button
                    type="button"
                    className={isEquipped ? 'secondary-cta' : 'primary-cta'}
                    onClick={() => onEquip(tab, outfit.id)}
                  >
                    {isEquipped ? (
                      <>
                        <Check size={14} />{' '}
                        <span>{locale === 'ckb' ? 'لەبەریەتی' : 'Equipped'}</span>
                      </>
                    ) : (
                      <span>{locale === 'ckb' ? 'لەبەرکردن' : 'Wear Outfit'}</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
