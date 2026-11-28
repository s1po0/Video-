import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { HEROINES, loc, MOOD_META } from '../data/catalog';
import { HEROINE_OUTFITS } from '../data/outfits';
import { TOWER_HOTSPOTS, TowerHotspot } from '../data/towerMap';
import { GameState, HeroineId, Locale, LocationId } from '../types/game';

interface HotelTowerMapProps {
  state: GameState;
  locale: Locale;
  equippedOutfits: Record<HeroineId, string>;
  getHeroinesAtLocation: (locId: LocationId) => HeroineId[];
  hasStoryReady: (hid: HeroineId) => boolean;
  onSelectHotspot: (spot: TowerHotspot) => void;
}

export function getEquippedOutfitImage(
  hid: HeroineId,
  equippedOutfits: Record<HeroineId, string>
): string {
  const chosenId = equippedOutfits[hid];
  const found = HEROINE_OUTFITS[hid].find((o) => o.id === chosenId);
  return found ? found.image : HEROINE_OUTFITS[hid][0].image;
}

export const HotelTowerMap: React.FC<HotelTowerMapProps> = ({
  state,
  locale,
  equippedOutfits,
  getHeroinesAtLocation,
  hasStoryReady,
  onSelectHotspot,
}) => {
  return (
    <div className="tower-map-wrapper">
      <div className="tower-map-canvas">
        <img
          src="/assets/bg_hotel_map.jpg"
          alt="Velvet Grand Tower Map"
          className="tower-map-img"
        />
        <div className="tower-elevator-glow" />

        {TOWER_HOTSPOTS.map((spot) => {
          const locGirls = getHeroinesAtLocation(spot.mappedLoc);
          const displayGirls = spot.privateOwner
            ? Array.from(new Set([spot.privateOwner, ...locGirls]))
            : locGirls;

          return (
            <motion.button
              key={spot.id}
              type="button"
              className={`tower-hotspot-pin ${spot.privateOwner ? 'private-suite' : ''}`}
              style={{
                left: `${spot.xPercent}%`,
                top: `${spot.yPercent}%`,
              }}
              whileTap={{ scale: 0.93 }}
              onClick={() => onSelectHotspot(spot)}
            >
              <div className="pin-floor-chip">
                <span>{spot.icon}</span>
                <strong>{spot.floorLabel}</strong>
              </div>
              <div className="pin-room-name">{loc(spot.title, locale)}</div>

              {displayGirls.length > 0 && (
                <div className="pin-avatars-row">
                  {displayGirls.map((hid) => (
                    <div
                      key={hid}
                      className="pin-girl-ring"
                      style={{ borderColor: HEROINES[hid].color }}
                    >
                      <img
                        src={getEquippedOutfitImage(hid, equippedOutfits)}
                        alt={hid}
                      />
                      <span className="pin-mood-dot">
                        {MOOD_META[state.heroines[hid].mood].icon}
                      </span>
                      {hasStoryReady(hid) && (
                        <span className="pin-story-star">
                          <Sparkles size={10} />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
