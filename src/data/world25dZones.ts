import type { HeroineId, LocationId } from '../types/game';

export type Zone25DId = 'city' | '1f' | '8f' | '12f' | '17f' | '18f';

export interface Sensor25D {
  id: string;
  nx: number; // 0..100% of map width
  ny: number; // 0..100% of map height
  radius: number; // in % units
  icon: string;
  labelKu: string;
  labelEn: string;
  kind:
    | 'goto_zone'
    | 'hospital'
    | 'mall'
    | 'career'
    | 'alley'
    | 'casino'
    | 'supercar'
    | 'saga'
    | 'bed'
    | 'spa'
    | 'bar'
    | 'shop'
    | 'sauna_heal';
  targetZone?: Zone25DId;
  hotspotId?: string;
  sagaChapter?: number;
}

export interface Npc25D {
  id: HeroineId | 'nara' | 'shadow';
  sprite: string;
  nameKu: string;
  nameEn: string;
  aura: string;
  nx: number;
  ny: number;
  patrolNx: number;
  patrolNy: number;
  locId?: LocationId;
  cityModal?: 'hospital' | 'alley' | 'casino';
}

export interface WaterZone25D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface Zone25DConfig {
  id: Zone25DId;
  badgeKu: string;
  badgeEn: string;
  titleKu: string;
  titleEn: string;
  mapUrl: string;
  spawn: { nx: number; ny: number };
  baseScale: number; // 2.5D character scale relative to map height
  perspectiveScale: number; // extra depth growth from top to bottom
  ambientColor: string;
  waterZones?: WaterZone25D[];
  sensors: Sensor25D[];
  npcs: Npc25D[];
}

export const ZONES_25D: Record<Zone25DId, Zone25DConfig> = {
  city: {
    id: 'city',
    badgeKu: '🏙️ شار',
    badgeEn: '🏙️ City',
    titleKu: 'شاری گەورەی مەخمەلی (2.5D ئازاد)',
    titleEn: 'Grand Velvet City (2.5D Open District)',
    mapUrl: '/assets/world_city_map.jpg',
    spawn: { nx: 50, ny: 63 },
    baseScale: 0.135,
    perspectiveScale: 0.055,
    ambientColor: '#fbbf24',
    sensors: [
      { id: 'enter_hotel', nx: 50, ny: 51, radius: 7.5, icon: '🏨', labelKu: 'چوونە ناو هۆتێلی مەخمەلی (1F)', labelEn: 'Enter Grand Velvet Hotel (1F)', kind: 'goto_zone', targetZone: '1f' },
      { id: 'hosp_door', nx: 20, ny: 39, radius: 8, icon: '🏥', labelKu: 'نەخۆشخانەی شار (دکتۆر نارا)', labelEn: 'City Hospital (Dr. Nara)', kind: 'hospital' },
      { id: 'mall_door', nx: 81, ny: 36, radius: 8, icon: '🛍️', labelKu: 'مۆڵی گەورەی ئەستێرە (شۆپینگ)', labelEn: 'Starlight Shopping Mall', kind: 'mall' },
      { id: 'career_door', nx: 78, ny: 80, radius: 8.5, icon: '💼', labelKu: 'تاوەری کارکردن (+$140 داهات)', labelEn: 'Career Work Tower (+$140)', kind: 'career' },
      { id: 'alley_door', nx: 21, ny: 81, radius: 8.5, icon: '🕵️', labelKu: 'کۆڵانی نهێنی (کاوەی سێبەر)', labelEn: 'Shadow Alley (Secret Broker)', kind: 'alley' },
      { id: 'car_parked', nx: 41, ny: 67, radius: 7, icon: '🏎️', labelKu: 'سواری سەیارە وەرزشییەکە بە!', labelEn: 'Drive Crimson Supercar!', kind: 'supercar' },
    ],
    npcs: [
      { id: 'nara', sprite: '/assets/sprite_nara.png', nameKu: 'دکتۆر نارا', nameEn: 'Dr. Nara', aura: '#34d399', nx: 25, ny: 44, patrolNx: 31, patrolNy: 49, cityModal: 'hospital' },
      { id: 'shadow', sprite: '/assets/sprite_shadow.png', nameKu: 'کاوەی سێبەر', nameEn: 'Kawa Shadow', aura: '#818cf8', nx: 25, ny: 75, patrolNx: 32, patrolNy: 71, cityModal: 'alley' },
      { id: 'layla', sprite: '/assets/sprite_layla.png', nameKu: 'لەیلا', nameEn: 'Layla', aura: '#fb7185', nx: 73, ny: 42, patrolNx: 66, patrolNy: 48, locId: 'boutique' },
    ],
  },

  '1f': {
    id: '1f',
    badgeKu: '🛎️ 1F لۆبی',
    badgeEn: '🛎️ 1F Lobby',
    titleKu: 'نهۆمی ١ — هۆڵی پێشوازیی شاهانە',
    titleEn: '1F — Royal Marble Grand Lobby',
    mapUrl: '/assets/world_1f_map.jpg',
    spawn: { nx: 50, ny: 65 },
    baseScale: 0.16,
    perspectiveScale: 0.05,
    ambientColor: '#fde68a',
    sensors: [
      { id: 'lobby_to_city', nx: 50, ny: 77, radius: 8, icon: '🏙️', labelKu: 'دەرچوون لە هۆتێل بۆ شار!', labelEn: 'Exit Hotel to Velvet City!', kind: 'goto_zone', targetZone: 'city' },
      { id: 'lobby_elev', nx: 50, ny: 29, radius: 7.5, icon: '🛗', labelKu: 'مەسعەد بۆ یانە و گازینۆ (8F)', labelEn: 'Elevator to 8F Club & Casino', kind: 'goto_zone', targetZone: '8f' },
      { id: 'lobby_desk', nx: 21, ny: 27, radius: 7.5, icon: '📖', labelKu: 'پێشوازی و داستانی ١٢ بەش', labelEn: 'Concierge & 12-Chapter Saga', kind: 'saga', sagaChapter: 1 },
      { id: 'lobby_piano', nx: 84, ny: 33, radius: 7.5, icon: '🎹', labelKu: 'کافێی پیانۆ و خواردنەوە', labelEn: 'Grand Piano Salon', kind: 'bar' },
      { id: 'lobby_shop', nx: 86, ny: 72, radius: 7.5, icon: '💐', labelKu: 'بووتیکی گوڵ و دیاری', labelEn: 'Lobby Gift Boutique', kind: 'shop' },
    ],
    npcs: [
      { id: 'aria', sprite: '/assets/sprite_aria.png', nameKu: 'ئاریا', nameEn: 'Aria', aura: '#fbbf24', nx: 75, ny: 38, patrolNx: 64, patrolNy: 46, locId: 'lounge' },
      { id: 'celine', sprite: '/assets/sprite_celine.png', nameKu: 'سێلین', nameEn: 'Celine', aura: '#c084fc', nx: 34, ny: 47, patrolNx: 41, patrolNy: 56, locId: 'lounge' },
    ],
  },

  '8f': {
    id: '8f',
    badgeKu: '🎰 8F گازینۆ',
    badgeEn: '🎰 8F Club',
    titleKu: 'نهۆمی ٨ — یانەی نیۆن و گازینۆی VIP',
    titleEn: '8F — Neon Nightclub & VIP Casino',
    mapUrl: '/assets/world_8f_map.jpg',
    spawn: { nx: 50, ny: 73 },
    baseScale: 0.165,
    perspectiveScale: 0.045,
    ambientColor: '#e879f9',
    sensors: [
      { id: 'elev_8f_up', nx: 50, ny: 62, radius: 7.5, icon: '🛗', labelKu: 'مەسعەد بۆ حەمامی شاهانە (12F)', labelEn: 'Elevator to 12F Royal Spa', kind: 'goto_zone', targetZone: '12f' },
      { id: 'casino_table', nx: 78, ny: 46, radius: 8.5, icon: '🎰', labelKu: 'مێزی ڕۆلێتی گازینۆ (یاریی بەخت!)', labelEn: 'VIP Roulette Table (Win Cash!)', kind: 'casino' },
      { id: 'neon_stage', nx: 24, ny: 48, radius: 8.5, icon: '💃', labelKu: 'سەکۆی سەمای نیۆن', labelEn: 'Neon Dancefloor', kind: 'saga' },
      { id: 'gold_bar_8f', nx: 82, ny: 82, radius: 7.5, icon: '🍸', labelKu: 'باڕی زێڕینی کۆکتێل', labelEn: 'Golden Mixology Bar', kind: 'bar' },
    ],
    npcs: [
      { id: 'aria', sprite: '/assets/sprite_aria.png', nameKu: 'ئاریا', nameEn: 'Aria', aura: '#fbbf24', nx: 31, ny: 52, patrolNx: 24, patrolNy: 38, locId: 'lounge' },
      { id: 'celine', sprite: '/assets/sprite_celine.png', nameKu: 'سێلین', nameEn: 'Celine', aura: '#c084fc', nx: 63, ny: 44, patrolNx: 68, patrolNy: 54, locId: 'fireplace' },
    ],
  },

  '12f': {
    id: '12f',
    badgeKu: '🧖‍♀️ 12F سپا',
    badgeEn: '🧖‍♀️ 12F Spa',
    titleKu: 'نهۆمی ١٢ — حەمامی مەڕمەڕ و سپای گوڵاو',
    titleEn: '12F — Royal Hammam & Rose Spa',
    mapUrl: '/assets/world_12f_map.jpg',
    spawn: { nx: 50, ny: 80 },
    baseScale: 0.165,
    perspectiveScale: 0.045,
    ambientColor: '#5eead4',
    waterZones: [
      { minX: 39, maxX: 61, minY: 34, maxY: 63 },
      { minX: 6, maxX: 33, minY: 72, maxY: 92 },
    ],
    sensors: [
      { id: 'elev_12f_up', nx: 50, ny: 89, radius: 7.5, icon: '🛗', labelKu: 'مەسعەد بۆ سویتەکان (17F)', labelEn: 'Elevator to 17F Suites', kind: 'goto_zone', targetZone: '17f' },
      { id: 'octagon_pool', nx: 50, ny: 49, radius: 9, icon: '🌺', labelKu: 'حەوزی گوڵاوی گەرم (دیمەنی تایبەت)', labelEn: 'Emerald Rose Pool (Spa Scene)', kind: 'spa', hotspotId: 'spot_bath_spa' },
      { id: 'milk_baths', nx: 20, ny: 82, radius: 8, icon: '🛁', labelKu: 'بانیۆی شیر و گوڵەباخ', labelEn: 'Rose-Milk Twin Tubs', kind: 'spa', hotspotId: 'spot_bath_spa' },
      { id: 'sauna_12f', nx: 19, ny: 25, radius: 8, icon: '🔥', labelKu: 'ساونای گەرم (پڕکردنەوەی وزە ⚡)', labelEn: 'Cedar Sauna (Restore Energy ⚡)', kind: 'sauna_heal' },
      { id: 'massage_12f', nx: 81, ny: 28, radius: 8, icon: '🕯️', labelKu: 'ژووری مەساجی شاهانە', labelEn: 'Royal Couples Massage', kind: 'spa', hotspotId: 'spot_shower_spa' },
    ],
    npcs: [
      { id: 'layla', sprite: '/assets/sprite_layla.png', nameKu: 'لەیلا', nameEn: 'Layla', aura: '#fb7185', nx: 64, ny: 50, patrolNx: 58, patrolNy: 64, locId: 'pool' },
    ],
  },

  '17f': {
    id: '17f',
    badgeKu: '🛏️ 17F سویت',
    badgeEn: '🛏️ 17F Suites',
    titleKu: 'نهۆمی ١٧ — سویتە شاهانەکان و هۆڵی جاز',
    titleEn: '17F — VIP Penthouse Suites & Jazz Lounge',
    mapUrl: '/assets/world_17f_map.jpg',
    spawn: { nx: 50, ny: 54 },
    baseScale: 0.165,
    perspectiveScale: 0.045,
    ambientColor: '#fcd34d',
    sensors: [
      { id: 'elev_17f_up', nx: 50, ny: 75, radius: 7.5, icon: '🛗', labelKu: 'مەسعەد بۆ مەلەوانگەی سەربان (18F)', labelEn: 'Elevator to 18F Infinity Pool', kind: 'goto_zone', targetZone: '18f' },
      { id: 'sipan_bed_17', nx: 18, ny: 25, radius: 7.5, icon: '🛏️', labelKu: 'تەختی خەوی سیپان (پشووی شەو)', labelEn: 'Sipan’s Master Bed (Rest)', kind: 'bed' },
      { id: 'layla_bath_17', nx: 38, ny: 28, radius: 7, icon: '🛁', labelKu: 'حەمامی گوڵاوی لەیلا', labelEn: 'Layla’s Golden Rose Bath', kind: 'spa', hotspotId: 'spot_bath_spa' },
      { id: 'celine_study', nx: 77, ny: 27, radius: 7.5, icon: '🔍', labelKu: 'مێزی بەڵگەکان و چیرۆکی ١٢ بەش', labelEn: 'Clue Desk & 12-Chapter Saga', kind: 'saga' },
      { id: 'jazz_17f', nx: 17, ny: 72, radius: 7.5, icon: '🍸', labelKu: 'باڕی جاز و مۆسیقا', labelEn: 'Velvet Jazz Bar', kind: 'bar' },
      { id: 'shop_17f', nx: 81, ny: 76, radius: 8, icon: '👗', labelKu: 'بووتیکی جلوبەرگ و دیاری', labelEn: 'Penthouse Fashion Boutique', kind: 'shop' },
    ],
    npcs: [
      { id: 'layla', sprite: '/assets/sprite_layla.png', nameKu: 'لەیلا', nameEn: 'Layla', aura: '#fb7185', nx: 51, ny: 30, patrolNx: 47, patrolNy: 48, locId: 'suite' },
      { id: 'celine', sprite: '/assets/sprite_celine.png', nameKu: 'سێلین', nameEn: 'Celine', aura: '#c084fc', nx: 72, ny: 34, patrolNx: 63, patrolNy: 50, locId: 'fireplace' },
      { id: 'aria', sprite: '/assets/sprite_aria.png', nameKu: 'ئاریا', nameEn: 'Aria', aura: '#fbbf24', nx: 28, ny: 74, patrolNx: 34, patrolNy: 60, locId: 'lounge' },
    ],
  },

  '18f': {
    id: '18f',
    badgeKu: '🌊 18F سەربان',
    badgeEn: '🌊 18F Pool',
    titleKu: 'نهۆمی ١٨ — مەلەوانگەی بێکۆتایی سەربان',
    titleEn: '18F — Rooftop Infinity Pool & Sky Bar',
    mapUrl: '/assets/world_18f_map.jpg',
    spawn: { nx: 50, ny: 71 },
    baseScale: 0.165,
    perspectiveScale: 0.045,
    ambientColor: '#38bdf8',
    waterZones: [
      { minX: 43, maxX: 90, minY: 12, maxY: 48 },
      { minX: 4, maxX: 32, minY: 56, maxY: 93 },
    ],
    sensors: [
      { id: 'elev_18_city', nx: 50, ny: 86, radius: 7.5, icon: '🏙️', labelKu: 'دابەزینی خێرا بۆ شاری مەخمەلی!', labelEn: 'Express Elevator to Velvet City!', kind: 'goto_zone', targetZone: 'city' },
      { id: 'inf_pool_18', nx: 63, ny: 30, radius: 9.5, icon: '🏊', labelKu: 'مەلەوانگەی بێکۆتایی (مەلەکردن)', labelEn: 'Infinity Pool (Romantic Swim)', kind: 'spa', hotspotId: 'spot_jacuzzi_18f' },
      { id: 'jacuzzi_18', nx: 12, ny: 65, radius: 7.5, icon: '♨️', labelKu: 'جاکوزیی گەرمی سەربان', labelEn: 'Steaming Sky Jacuzzi', kind: 'spa', hotspotId: 'spot_jacuzzi_18f' },
      { id: 'cabana_18', nx: 16, ny: 22, radius: 7.5, icon: '🌺', labelKu: 'کەپری ئاوریشمی (بەشی ٦ی چیرۆک)', labelEn: 'Silk Cabana (Saga Ch 6)', kind: 'saga', sagaChapter: 6 },
      { id: 'bar_18', nx: 76, ny: 83, radius: 8, icon: '🥂', labelKu: 'باڕی شامپانیای سەربان', labelEn: 'Sky Champagne Bar', kind: 'bar' },
    ],
    npcs: [
      { id: 'aria', sprite: '/assets/sprite_aria.png', nameKu: 'ئاریا', nameEn: 'Aria', aura: '#fbbf24', nx: 62, ny: 54, patrolNx: 56, patrolNy: 42, locId: 'pool' },
      { id: 'layla', sprite: '/assets/sprite_layla.png', nameKu: 'لەیلا', nameEn: 'Layla', aura: '#fb7185', nx: 26, ny: 42, patrolNx: 33, patrolNy: 54, locId: 'balcony' },
    ],
  },
};

export const ZONE_ORDER_25D: Zone25DId[] = ['city', '1f', '8f', '12f', '17f', '18f'];
