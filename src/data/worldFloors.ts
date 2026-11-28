import { HeroineId, LocalizedText, LocationId } from '../types/game';

export type FloorId = '17f' | '18f';

export interface RectBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoomLabelZone {
  id: string;
  x: number;
  y: number;
  title: LocalizedText;
  mappedLoc: LocationId;
}

export interface WorldSensor {
  id: string;
  x: number;
  y: number;
  radius: number;
  icon: string;
  prompt: LocalizedText;
  actionType: 'elevator' | 'secret' | 'spa' | 'shop' | 'mixology' | 'rest';
  targetFloor?: FloorId;
  targetSpawn?: { x: number; y: number };
  hotspotId?: string;
}

export interface WorldVfxZone {
  kind: 'pool_water' | 'jacuzzi_steam' | 'rose_bath' | 'fireplace' | 'jazz_notes' | 'elevator_glow' | 'fairy_lights';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorldFloorData {
  id: FloorId;
  width: number;
  height: number;
  mapImage: string;
  name: LocalizedText;
  defaultSpawn: { x: number; y: number };
  waterZones: RectBox[];
  walls: RectBox[];
  labels: RoomLabelZone[];
  vfx: WorldVfxZone[];
  sensors: WorldSensor[];
  heroineSpots: Record<HeroineId, { floor: FloorId; x: number; y: number; loc: LocationId }>;
}

// World dimensions: 2240 x 1400 (exact 16:10 match to world_17f_map.jpg & world_18f_map.jpg)
export const WORLD_FLOORS: Record<FloorId, WorldFloorData> = {
  '17f': {
    id: '17f',
    width: 2240,
    height: 1400,
    mapImage: '/assets/world_17f_map.jpg',
    name: { ckb: 'نهۆمی ١٧ • سویتەکان و جاز لاونج', en: '17F • Suites & Jazz Lounge' },
    defaultSpawn: { x: 1120, y: 740 },
    waterZones: [
      { x: 790, y: 220, w: 150, h: 240 }, // Layla's golden rose bath
    ],
    // Invisible boundary walls leaving wide-open doorways into every single room!
    walls: [
      { x: 0, y: 0, w: 2240, h: 55 },
      { x: 0, y: 1355, w: 2240, h: 45 },
      { x: 0, y: 0, w: 45, h: 1400 },
      { x: 2195, y: 0, w: 45, h: 1400 },
      // Vertical dividers between top suites (leaving shower passage open)
      { x: 725, y: 55, w: 30, h: 480 },
      { x: 1480, y: 55, w: 30, h: 480 },
      // Top hallway wall segments with wide open doorways at x=615, x=1120, x=1650, x=1910
      { x: 45, y: 535, w: 500, h: 32 },
      { x: 685, y: 535, w: 355, h: 32 },
      { x: 1200, y: 535, w: 380, h: 32 },
      { x: 1725, y: 535, w: 135, h: 32 },
      // Lower walls with wide entrances into Jazz Bar (x=615) & Boutique (x=1650)
      { x: 45, y: 740, w: 495, h: 30 },
      { x: 830, y: 780, w: 35, h: 570 },
      { x: 1385, y: 780, w: 35, h: 570 },
      { x: 1735, y: 740, w: 460, h: 30 },
    ],
    labels: [
      { id: 'lbl_sipan', x: 400, y: 130, title: { ckb: '👑 سویتی سیپان ١٧٠٩', en: "👑 Sipan's Suite 1709" }, mappedLoc: 'suite' },
      { id: 'lbl_layla', x: 1120, y: 120, title: { ckb: '🌹 ژوور و حەمامی لەیلا', en: "🌹 Layla's Suite & Rose Bath" }, mappedLoc: 'suite' },
      { id: 'lbl_celine', x: 1710, y: 120, title: { ckb: '🕵️‍♀️ ژووری سێلین', en: "🕵️‍♀️ Celine's Suite" }, mappedLoc: 'suite' },
      { id: 'lbl_shower', x: 2075, y: 120, title: { ckb: '🚿 شاوەری هەڵماوی', en: '🚿 Steam Shower' }, mappedLoc: 'suite' },
      { id: 'lbl_jazz', x: 380, y: 860, title: { ckb: '🎷 جاز لاونج و بار', en: '🎷 Velvet Jazz Bar' }, mappedLoc: 'lounge' },
      { id: 'lbl_elev', x: 1120, y: 920, title: { ckb: '🛗 ئەسانسۆر بۆ سەربان 18F', en: '🛗 Elevator to 18F Rooftop' }, mappedLoc: 'lounge' },
      { id: 'lbl_shop', x: 1820, y: 860, title: { ckb: '💎 فرۆشگای مەخمەلی', en: '💎 Luxury Boutique' }, mappedLoc: 'boutique' },
    ],
    vfx: [
      { kind: 'rose_bath', x: 785, y: 215, w: 165, h: 255 },
      { kind: 'fireplace', x: 1650, y: 140, w: 140, h: 110 },
      { kind: 'jacuzzi_steam', x: 1990, y: 150, w: 190, h: 220 },
      { kind: 'jazz_notes', x: 220, y: 880, w: 520, h: 360 },
      { kind: 'elevator_glow', x: 1015, y: 900, w: 210, h: 310 },
      { kind: 'fairy_lights', x: 920, y: 610, w: 400, h: 180 },
    ],
    sensors: [
      {
        id: 'elev_to_18f',
        x: 1120,
        y: 1060,
        radius: 135,
        icon: '🛗',
        prompt: { ckb: 'سەرکەوتن بۆ سەربان و مەلەوانگە (18F) 🌊', en: 'Ride Elevator to 18F Rooftop Pool 🌊' },
        actionType: 'elevator',
        targetFloor: '18f',
        targetSpawn: { x: 1110, y: 980 },
      },
      {
        id: 'sipan_bed_rest',
        x: 405,
        y: 320,
        radius: 130,
        icon: '🛌',
        prompt: { ckb: 'پشوودان لە سیسەمەکەی سیپان (وزەی نوێ ⚡)', en: "Rest in Sipan's King Bed (Restore Energy ⚡)" },
        actionType: 'rest',
      },
      {
        id: 'layla_bath_spa',
        x: 865,
        y: 345,
        radius: 120,
        icon: '🛁',
        prompt: { ckb: 'چوونە لای حەمامە پڕ لە گوڵ و هەڵمەکەی لەیلا 🔥', en: "Enter Layla's Rose-Petal Steam Bath 🔥" },
        actionType: 'spa',
        hotspotId: 'layla_room',
      },
      {
        id: 'layla_bed_secret',
        x: 1125,
        y: 360,
        radius: 115,
        icon: '💋',
        prompt: { ckb: 'پشکنینی نامە و جلی سەر سیسەمەکەی لەیلا', en: "Inspect Layla's Velvet Canopy Bed" },
        actionType: 'secret',
        hotspotId: 'layla_room',
      },
      {
        id: 'celine_desk_secret',
        x: 1720,
        y: 365,
        radius: 115,
        icon: '🔎',
        prompt: { ckb: 'سەیرکردنی دۆسیە نهێنییەکەی سەر مێزی سێلین', en: "Inspect Celine's Case Desk" },
        actionType: 'secret',
        hotspotId: 'celine_room',
      },
      {
        id: 'celine_shower_spa',
        x: 2070,
        y: 330,
        radius: 125,
        icon: '🚿',
        prompt: { ckb: 'چوونە ژووری شاوەرە تەماوی و گەرمەکەی سێلین 🔥', en: "Step into Celine's Steamy Glass Spa 🔥" },
        actionType: 'spa',
        hotspotId: 'celine_room',
      },
      {
        id: 'jazz_bar_mix',
        x: 330,
        y: 980,
        radius: 135,
        icon: '🍸',
        prompt: { ckb: 'ئامادەکردنی کۆکتێلی شەوانە لە بارەکە (+$45)', en: 'Mix Signature Velvet Cocktail (+$45)' },
        actionType: 'mixology',
      },
      {
        id: 'boutique_counter',
        x: 1810,
        y: 1050,
        radius: 145,
        icon: '🛍️',
        prompt: { ckb: 'کڕینی دیاری و عەتری گرانبەها بۆ کچەکان', en: 'Shop Luxury Gifts & Perfumes' },
        actionType: 'shop',
      },
    ],
    heroineSpots: {
      layla: { floor: '17f', x: 1030, y: 430, loc: 'suite' },
      celine: { floor: '17f', x: 1680, y: 445, loc: 'suite' },
      aria: { floor: '18f', x: 1180, y: 430, loc: 'pool' },
    },
  },
  '18f': {
    id: '18f',
    width: 2240,
    height: 1400,
    mapImage: '/assets/world_18f_map.jpg',
    name: { ckb: 'نهۆمی ١٨ • سەربان و مەلەوانگەی کراوە', en: '18F • Open-Air Rooftop Infinity Pool' },
    defaultSpawn: { x: 1110, y: 960 },
    waterZones: [
      { x: 965, y: 155, w: 1030, h: 520 }, // Giant turquoise infinity pool!
      { x: 120, y: 780, w: 260, h: 250 },  // Jacuzzi tub 1
      { x: 455, y: 1055, w: 270, h: 255 }, // Jacuzzi tub 2
    ],
    walls: [
      { x: 0, y: 0, w: 2240, h: 55 },
      { x: 0, y: 1355, w: 2240, h: 45 },
      { x: 0, y: 0, w: 45, h: 1400 },
      { x: 2110, y: 0, w: 130, h: 1400 }, // Right glass skyline balcony rail
    ],
    labels: [
      { id: 'lbl_cabana', x: 420, y: 115, title: { ckb: '🌺 کەپری ئاوریشمی تایبەت', en: '🌺 Private Silk Cabanas' }, mappedLoc: 'pool' },
      { id: 'lbl_pool', x: 1480, y: 125, title: { ckb: '🌊 مەلەوانگەی گەرمی سەربان', en: '🌊 Heated Infinity Pool' }, mappedLoc: 'pool' },
      { id: 'lbl_jacuzzi', x: 350, y: 760, title: { ckb: '🫧 جاکوزیی کەف و هەڵم', en: '🫧 Steaming Foam Jacuzzis' }, mappedLoc: 'pool' },
      { id: 'lbl_skybar', x: 1710, y: 820, title: { ckb: '🥂 سکای بار و ئاگردان', en: '🥂 Sky Champagne Bar' }, mappedLoc: 'balcony' },
      { id: 'lbl_elev18', x: 1110, y: 1120, title: { ckb: '🛗 گەڕانەوە بۆ ژوورەکان 17F', en: '🛗 Elevator to 17F Suites' }, mappedLoc: 'lounge' },
    ],
    vfx: [
      { kind: 'pool_water', x: 965, y: 155, w: 1030, h: 520 },
      { kind: 'jacuzzi_steam', x: 120, y: 780, w: 260, h: 250 },
      { kind: 'jacuzzi_steam', x: 455, y: 1055, w: 270, h: 255 },
      { kind: 'fireplace', x: 1615, y: 870, w: 205, h: 55 },
      { kind: 'fairy_lights', x: 80, y: 80, w: 620, h: 540 },
      { kind: 'fairy_lights', x: 1360, y: 830, w: 700, h: 480 },
      { kind: 'elevator_glow', x: 960, y: 1090, w: 300, h: 260 },
    ],
    sensors: [
      {
        id: 'elev_to_17f',
        x: 1110,
        y: 1140,
        radius: 145,
        icon: '🛗',
        prompt: { ckb: 'گەڕانەوە بۆ ژوورە تایبەتەکان (17F)', en: 'Return to 17F Private Suites' },
        actionType: 'elevator',
        targetFloor: '17f',
        targetSpawn: { x: 1120, y: 740 },
      },
      {
        id: 'cabana_secret',
        x: 470,
        y: 340,
        radius: 145,
        icon: '🌺',
        prompt: { ckb: 'چوونە ناو کەپرە ئاوریشمییەکەی ئاریا 💋', en: "Enter Aria's Private Silk Cabana 💋" },
        actionType: 'secret',
        hotspotId: 'aria_cabana',
      },
      {
        id: 'jacuzzi_spa_1',
        x: 255,
        y: 905,
        radius: 145,
        icon: '🫧',
        prompt: { ckb: 'چوونە ناو جاکوزیی کەف و ئاوی گەرم لەگەڵ ئاریا 🔥', en: 'Slip into the Steaming Foam Jacuzzi with Aria 🔥' },
        actionType: 'spa',
        hotspotId: 'rooftop_pool',
      },
      {
        id: 'jacuzzi_spa_2',
        x: 590,
        y: 1175,
        radius: 145,
        icon: '🫧',
        prompt: { ckb: 'پشوودان لە جاکوزیی مەڕمەڕی دووەم 🔥', en: 'Relax in the Lower Marble Jacuzzi 🔥' },
        actionType: 'spa',
        hotspotId: 'aria_cabana',
      },
      {
        id: 'sky_bar_mix',
        x: 1715,
        y: 1140,
        radius: 145,
        icon: '🥂',
        prompt: { ckb: 'تێکردنی شامپانیای سەربان (+$45)', en: 'Pour Rooftop Champagne (+$45)' },
        actionType: 'mixology',
      },
    ],
    heroineSpots: {
      aria: { floor: '18f', x: 1190, y: 420, loc: 'pool' },
      layla: { floor: '18f', x: 520, y: 390, loc: 'pool' },
      celine: { floor: '18f', x: 1620, y: 980, loc: 'balcony' },
    },
  },
};
