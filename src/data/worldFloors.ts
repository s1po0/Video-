import { HeroineId, LocalizedText, LocationId } from '../types/game';

export type FloorId = '17f' | '18f';

export interface RectBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoomZone extends RectBox {
  id: string;
  floorType: 'marble' | 'wood' | 'carpet' | 'water' | 'deck' | 'grass';
  tint: string;
  title: LocalizedText;
}

export interface WorldProp extends RectBox {
  kind:
    | 'bed'
    | 'jacuzzi'
    | 'piano'
    | 'bar'
    | 'fireplace'
    | 'sofa'
    | 'cabana'
    | 'table'
    | 'elevator'
    | 'plant';
  color: string;
  solid?: boolean;
  label?: LocalizedText;
}

export interface WorldSensor {
  id: string;
  x: number;
  y: number;
  radius: number;
  icon: string;
  prompt: LocalizedText;
  actionType: 'location' | 'secret' | 'spa' | 'elevator' | 'shop' | 'mixology' | 'rest';
  mappedLoc?: LocationId;
  hotspotId?: string;
  targetFloor?: FloorId;
  targetSpawn?: { x: number; y: number };
}

export interface FloorMapData {
  id: FloorId;
  width: number;
  height: number;
  name: LocalizedText;
  defaultSpawn: { x: number; y: number };
  rooms: RoomZone[];
  walls: RectBox[];
  props: WorldProp[];
  sensors: WorldSensor[];
  heroineSpots: Record<HeroineId, { floor: FloorId; x: number; y: number }>;
}

export const WORLD_FLOORS: Record<FloorId, FloorMapData> = {
  '17f': {
    id: '17f',
    width: 2000,
    height: 1400,
    name: { ckb: 'نهۆمی ١٧ • ژوورە تایبەتەکان و هۆڵی جاز', en: '17F • VIP Suites & Jazz Lounge' },
    defaultSpawn: { x: 1000, y: 700 },
    rooms: [
      // Central Grand Velvet Corridor
      { id: 'hall', x: 80, y: 580, w: 1840, h: 240, floorType: 'carpet', tint: '#3b122b', title: { ckb: 'ڕێڕەوی مەخمەلی', en: 'Velvet Grand Hall' } },
      // Top-Left: Suite 1709 Bedroom + Layla's Marble Bath
      { id: 'suite_bed', x: 80, y: 80, w: 560, h: 480, floorType: 'wood', tint: '#2a1829', title: { ckb: 'ژووری خەوی ١٧٠٩', en: 'Suite 1709 Bedroom' } },
      { id: 'layla_bath', x: 660, y: 80, w: 300, h: 480, floorType: 'marble', tint: '#1f2937', title: { ckb: 'گەرماوی مەڕمەڕی لەیلا', en: 'Marble Rose Bath' } },
      // Top-Right: Celine's Suite + Frosted Shower
      { id: 'celine_suite', x: 1040, y: 80, w: 560, h: 480, floorType: 'wood', tint: '#28162b', title: { ckb: 'ژووری تایبەتی سێلین', en: 'Celine’s Private Suite' } },
      { id: 'celine_bath', x: 1620, y: 80, w: 300, h: 480, floorType: 'marble', tint: '#1e2636', title: { ckb: 'حەمامی شوشەیی سێلین', en: 'Frosted Shower Room' } },
      // Bottom-Left: Velvet Jazz Lounge & Backstage
      { id: 'jazz_lounge', x: 80, y: 840, w: 880, h: 480, floorType: 'wood', tint: '#23122e', title: { ckb: 'یانەی جاز و باڕ', en: 'Velvet Jazz Club & Bar' } },
      // Bottom-Right: Glass Rain Terrace & Luxury Boutique
      { id: 'glass_garden', x: 1040, y: 840, w: 540, h: 480, floorType: 'grass', tint: '#132a28', title: { ckb: 'باخچەی شوشەیی ژێر باران', en: 'Rainlit Glass Garden' } },
      { id: 'boutique_room', x: 1600, y: 840, w: 320, h: 480, floorType: 'marble', tint: '#2d1c38', title: { ckb: 'فرۆشگای دیاری', en: 'Midnight Boutique' } },
    ],
    walls: [
      // Outer boundary walls
      { x: 0, y: 0, w: 2000, h: 80 },
      { x: 0, y: 1320, w: 2000, h: 80 },
      { x: 0, y: 0, w: 80, h: 1400 },
      { x: 1920, y: 0, w: 80, h: 1400 },
      // Top corridor walls with wide doorways at x=320..440 and x=1260..1380
      { x: 80, y: 560, w: 240, h: 22 },
      { x: 440, y: 560, w: 820, h: 22 },
      { x: 1380, y: 560, w: 540, h: 22 },
      // Inner divider between Suite 1709 & Layla's Bath (doorway at y=280..390)
      { x: 640, y: 80, w: 20, h: 200 },
      { x: 640, y: 390, w: 20, h: 170 },
      // Center divider between Layla Bath & Celine Suite
      { x: 960, y: 80, w: 80, h: 480 },
      // Inner divider between Celine Suite & Frosted Shower (doorway at y=280..390)
      { x: 1600, y: 80, w: 20, h: 200 },
      { x: 1600, y: 390, w: 20, h: 170 },
      // Bottom corridor walls with doorways at x=420..560, x=1250..1380, x=1700..1810
      { x: 80, y: 820, w: 340, h: 22 },
      { x: 560, y: 820, w: 690, h: 22 },
      { x: 1380, y: 820, w: 320, h: 22 },
      { x: 1810, y: 820, w: 110, h: 22 },
      // Divider between Jazz Lounge & Glass Garden + Boutique
      { x: 960, y: 840, w: 80, h: 480 },
      { x: 1580, y: 840, w: 20, h: 480 },
    ],
    props: [
      { kind: 'elevator', x: 945, y: 635, w: 110, h: 110, color: '#fbbf24', label: { ckb: '🛗 بۆ سەربان 18F', en: '🛗 To Roof 18F' } },
      { kind: 'bed', x: 140, y: 130, w: 210, h: 165, color: '#9f1239', solid: true, label: { ckb: 'سیسەمی ١٧٠٩', en: 'King Bed' } },
      { kind: 'sofa', x: 150, y: 380, w: 170, h: 75, color: '#581c87', solid: true },
      { kind: 'jacuzzi', x: 725, y: 150, w: 190, h: 190, color: '#fda4af', solid: false, label: { ckb: 'بانیۆی کەف و گوڵ', en: 'Rose Bath' } },
      { kind: 'fireplace', x: 1100, y: 100, w: 180, h: 65, color: '#ea580c', solid: true, label: { ckb: 'ئاگردان', en: 'Fireplace' } },
      { kind: 'bed', x: 1340, y: 135, w: 195, h: 155, color: '#6b21a8', solid: true, label: { ckb: 'سیسەمی سێلین', en: 'Celine Bed' } },
      { kind: 'jacuzzi', x: 1680, y: 155, w: 185, h: 185, color: '#93c5fd', solid: false, label: { ckb: 'حەمامی هەڵم', en: 'Steam Shower' } },
      { kind: 'piano', x: 150, y: 920, w: 160, h: 130, color: '#1e1b4b', solid: true, label: { ckb: 'پیانۆی جاز', en: 'Grand Piano' } },
      { kind: 'bar', x: 580, y: 1140, w: 310, h: 80, color: '#b45309', solid: true, label: { ckb: 'باڕی مەخمەلی', en: 'Velvet Bar' } },
      { kind: 'plant', x: 1140, y: 940, w: 90, h: 90, color: '#059669', solid: true },
      { kind: 'sofa', x: 1280, y: 1110, w: 180, h: 80, color: '#115e59', solid: true },
      { kind: 'table', x: 1670, y: 980, w: 180, h: 90, color: '#c084fc', solid: true, label: { ckb: 'فرۆشگا', en: 'Boutique' } },
    ],
    sensors: [
      { id: 'elev_up', x: 1000, y: 690, radius: 95, icon: '🛗', prompt: { ckb: 'سەرکەوتن بە ئاسانسۆر بۆ سەربان و مەلەوانگە (18F)', en: 'Ride Glass Elevator to 18F Rooftop Pool' }, actionType: 'elevator', targetFloor: '18f', targetSpawn: { x: 1000, y: 1180 } },
      { id: 's_1709_secret', x: 245, y: 310, radius: 95, icon: '🎙️', prompt: { ckb: 'تۆماری دەنگیی نهێنیی سەر سیسەمەکە + خەوتن', en: 'Bedside Secret Voice Memo / Rest' }, actionType: 'secret', hotspotId: 'suite_1709' },
      { id: 's_layla_spa', x: 820, y: 260, radius: 115, icon: '🌫️', prompt: { ckb: 'چوونە لای بانیۆی کەف و گوڵەباخی لەیلا', en: 'Enter Layla’s Steamy Rose-Foam Bath' }, actionType: 'spa', hotspotId: 'suite_1709' },
      { id: 's_celine_secret', x: 1420, y: 310, radius: 95, icon: '📂', prompt: { ckb: 'سەیرکردنی وێنە شاردراوەکەی سیسەمی سێلین', en: 'Inspect Celine’s Bedside Secret' }, actionType: 'secret', hotspotId: 'celine_room' },
      { id: 's_celine_spa', x: 1770, y: 260, radius: 115, icon: '🌫️', prompt: { ckb: 'چوونە بەردەم شوشەی هەڵمداری حەمامەکەی سێلین', en: 'Approach Celine’s Frosted Steam Shower' }, actionType: 'spa', hotspotId: 'celine_room' },
      { id: 's_mixology', x: 735, y: 1100, radius: 105, icon: '🍸', prompt: { ckb: 'کارکردن لە باڕی جاز (+پارە 💵)', en: 'Mix VIP Cocktails (+Cash 💵)' }, actionType: 'mixology' },
      { id: 's_backstage', x: 230, y: 1080, radius: 100, icon: '🎹', prompt: { ckb: 'ژووری خۆگۆڕینی پشت شانۆی لەیلا', en: 'Layla’s Backstage Dressing Room' }, actionType: 'secret', hotspotId: 'jazz_stage' },
      { id: 's_terrace', x: 1360, y: 1060, radius: 105, icon: '🌧️', prompt: { ckb: 'گۆشە تاریکەکەی باخچە شوشەییەکە', en: 'Hidden Rainlit Glass Alcove' }, actionType: 'secret', hotspotId: 'sky_terrace' },
      { id: 's_shop', x: 1760, y: 1080, radius: 105, icon: '🛍️', prompt: { ckb: 'کردنەوەی فرۆشگای دیاری و عەتر', en: 'Browse Midnight Gift Boutique' }, actionType: 'shop' },
    ],
    heroineSpots: {
      layla: { floor: '17f', x: 480, y: 260 },
      celine: { floor: '17f', x: 1210, y: 250 },
      aria: { floor: '18f', x: 640, y: 420 },
    },
  },
  '18f': {
    id: '18f',
    width: 2000,
    height: 1400,
    name: { ckb: 'نهۆمی ١٨ • سەربان، مەلەوانگە و کەپری ئاوریشم', en: '18F • Open-Air Rooftop Pool & Cabanas' },
    defaultSpawn: { x: 1000, y: 1160 },
    rooms: [
      // Open-Air Teak Wood Rooftop Deck
      { id: 'roof_deck', x: 80, y: 80, w: 1840, h: 1240, floorType: 'deck', tint: '#1e162b', title: { ckb: 'سەربانی کراوەی نهۆمی ١٨', en: '18F Starlit Sky Deck' } },
      // Giant Heated Infinity Pool (Walkable water!)
      { id: 'infinity_pool', x: 640, y: 140, w: 740, h: 520, floorType: 'water', tint: '#0e4f6e', title: { ckb: 'مەلەوانگەی گەرمی بێسنوور', en: 'Heated Infinity Pool' } },
      // Top-Left: Aria's Private Silk Cabana
      { id: 'silk_cabana', x: 130, y: 140, w: 430, h: 450, floorType: 'carpet', tint: '#4c112c', title: { ckb: 'کەپری ئاوریشمی ئاریا', en: 'Aria’s Private Silk Cabana' } },
      // Top-Right: Private Rooftop Foam Jacuzzi
      { id: 'roof_jacuzzi_zone', x: 1460, y: 140, w: 400, h: 450, floorType: 'marble', tint: '#271b38', title: { ckb: 'جاکوزیی هەڵم و کەف', en: 'Private Foam Jacuzzi' } },
    ],
    walls: [
      { x: 0, y: 0, w: 2000, h: 80 },
      { x: 0, y: 1320, w: 2000, h: 80 },
      { x: 0, y: 0, w: 80, h: 1400 },
      { x: 1920, y: 0, w: 80, h: 1400 },
    ],
    props: [
      { kind: 'elevator', x: 945, y: 1185, w: 110, h: 110, color: '#fbbf24', label: { ckb: '🛗 بۆ نهۆمی ١٧', en: '🛗 To 17F Suites' } },
      { kind: 'cabana', x: 170, y: 180, w: 240, h: 180, color: '#be123c', solid: false, label: { ckb: 'کەپری تایبەت', en: 'Silk Cabana' } },
      { kind: 'jacuzzi', x: 1555, y: 210, w: 220, h: 220, color: '#f472b6', solid: false, label: { ckb: 'جاکوزیی کەفدار', en: 'Foam Jacuzzi' } },
      { kind: 'bar', x: 220, y: 980, w: 320, h: 85, color: '#d97706', solid: true, label: { ckb: 'باڕی سەربان', en: 'Sky Pool Bar' } },
      { kind: 'sofa', x: 1460, y: 960, w: 240, h: 90, color: '#4338ca', solid: true, label: { ckb: 'قەنەفەی ئەستێرەکان', en: 'Starlight Lounge' } },
    ],
    sensors: [
      { id: 'elev_down', x: 1000, y: 1220, radius: 100, icon: '🛗', prompt: { ckb: 'گەڕانەوە بۆ ژوورە تایبەتەکان (نهۆمی ١٧)', en: 'Take Glass Elevator Down to 17F Suites' }, actionType: 'elevator', targetFloor: '17f', targetSpawn: { x: 1000, y: 700 } },
      { id: 's_cabana', x: 300, y: 310, radius: 120, icon: '⛺', prompt: { ckb: 'لادانی پەردەی کەپرە ئاوریشمییەکەی ئاریا', en: 'Slip Inside Aria’s Velvet Cabana' }, actionType: 'secret', hotspotId: 'roof_cabana' },
      { id: 's_aria_jacuzzi', x: 1665, y: 320, radius: 130, icon: '🌫️', prompt: { ckb: 'چوونە ناو جاکوزییە کەفدار و تەمگرتووەکەی سەربان', en: 'Enter Steaming Rooftop Foam Jacuzzi' }, actionType: 'spa', hotspotId: 'roof_cabana' },
      { id: 's_pool_swim', x: 1010, y: 400, radius: 150, icon: '🌊', prompt: { ckb: 'مەلەکردنی نیوەشەو لە ناو ئاوە گەرمەکە', en: 'Midnight Swim in the Heated Infinity Pool' }, actionType: 'secret', hotspotId: 'roof_pool' },
      { id: 's_roof_bar', x: 380, y: 940, radius: 105, icon: '🥂', prompt: { ckb: 'ئامادەکردنی خواردنەوە لە سەربان (+پارە 💵)', en: 'Mix Rooftop Cocktails (+Cash 💵)' }, actionType: 'mixology' },
    ],
    heroineSpots: {
      layla: { floor: '17f', x: 480, y: 260 },
      celine: { floor: '17f', x: 1210, y: 250 },
      aria: { floor: '18f', x: 880, y: 420 },
    },
  },
};
