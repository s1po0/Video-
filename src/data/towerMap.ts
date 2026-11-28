import { HeroineId, LocalizedText, LocationId, SceneBeat } from '../types/game';

export interface TowerHotspot {
  id: string;
  floorLabel: string;
  mappedLoc: LocationId;
  privateOwner?: HeroineId;
  xPercent: number;
  yPercent: number;
  icon: string;
  title: LocalizedText;
  sub: LocalizedText;
  roomBg: string;
  secretObject: {
    label: LocalizedText;
    discoveryTitle: LocalizedText;
    beats: SceneBeat[];
  };
}

export const TOWER_HOTSPOTS: TowerHotspot[] = [
  {
    id: 'roof_cabana',
    floorLabel: '18F ROOF',
    mappedLoc: 'pool',
    privateOwner: 'aria',
    xPercent: 34,
    yPercent: 11,
    icon: '⛺',
    title: { ckb: 'کەپری تایبەتی سەربان', en: 'Private Silk Cabana (18F)' },
    sub: { ckb: 'پەردەی ئاوریشم و نهێنییەکانی ئاریا', en: 'Aria’s Candlelit Rooftop Hideaway' },
    roomBg: '/assets/bg_cabana.jpg',
    secretObject: {
      label: { ckb: '🔍 لادانی پەردەی کەپرە تایبەتەکە', en: '🔍 Part the Velvet Cabana Curtains' },
      discoveryTitle: { ckb: 'نهێنیی کەپری سەربان', en: 'Aria’s Cabana Surprise' },
      beats: [
        {
          speaker: 'aria',
          image: '/assets/aria_ruby.jpg',
          camera: 'intimate_zoom',
          effect: 'heartbeat',
          unlockCg: 'aria_ruby',
          text: {
            ckb: 'کاتێک پەردە ئاوریشمییەکەی سەربان لادەدەیت، دەبینیت ئاریا بە عەزییە شەرابییە تەنکەکەیەوە لەبەر ڕووناکیی مۆمەکان پاڵکەوتووە و کارتێکی بە ناوی تۆوە لە دەستدایە! لێوی دەگەزێت و دەستت ڕادەکێشێتە ژوورەوە: «پێشبینیم نەدەکرد بەم درەنگە بێیتە سەربان... مادام خۆت پەردەکەت لادا، ئەمشەو لەم کەپرە ناچیتە دەرەوە!»',
            en: 'Parting the silk curtains, you catch Aria lounging in her wine-red lace dress by candlelight—she pulls you inside with a breathless grin: “Didn’t expect you up here this late… now I’m keeping you.”',
          },
        },
      ],
    },
  },
  {
    id: 'roof_pool',
    floorLabel: '18F POOL',
    mappedLoc: 'pool',
    xPercent: 66,
    yPercent: 16,
    icon: '🌊',
    title: { ckb: 'مەلەوانگەی گەرمی سەربان', en: '18F Heated Infinity Pool' },
    sub: { ckb: 'مەلەکردنی نیوەشەو لەژێر ئەستێرەکان', en: 'Steaming Midnight Rooftop Pool' },
    roomBg: '/assets/bg_pool.jpg',
    secretObject: {
      label: { ckb: '🌊 نزیکبوونەوە لە ناو هەڵمی مەلەوانگەکە', en: '🌊 Step Into the Steaming Pool Edge' },
      discoveryTitle: { ckb: 'گەرمیی نیوەشەوی سەربان', en: 'Midnight Infinity Pool Heat' },
      beats: [
        {
          speaker: 'aria',
          image: '/assets/aria_swim.jpg',
          camera: 'intimate_zoom',
          effect: 'warm_glow',
          unlockCg: 'aria_swim',
          text: {
            ckb: 'لە ناو هەڵمی گەرمی سەربانەکەدا، ئاریا بە بیکینییە ڕەش و زێڕینەکەیەوە دێتە لێواری مەلەوانگەکە و پەنجە تەڕەکانی دەخاتە سەر مەچەکت: «ئاوەکە دەکوڵێت، بەڵام نیگاکەی تۆ زۆر گەرمترە... وەرە خوارەوە بۆ لام.»',
            en: 'Aria glides through the warm mist in her black-and-gold bikini, catching your wrist: “The water’s hot, but your gaze is hotter… come in with me.”',
          },
        },
      ],
    },
  },
  {
    id: 'suite_1709',
    floorLabel: '17F BEDROOM',
    mappedLoc: 'suite',
    privateOwner: 'layla',
    xPercent: 48,
    yPercent: 28,
    icon: '🛏️',
    title: { ckb: 'ژووری خەوی شاهانە (١٧٠٩)', en: 'VIP Bedroom Suite 1709' },
    sub: { ckb: 'سیسەمی مەخمەلی و دیداری تایبەتی شەو', en: 'Master Four-Poster Bedroom' },
    roomBg: '/assets/bg_penthouse.jpg',
    secretObject: {
      label: { ckb: '🎙️ پشکنینی تۆماری دەنگیی سەر مێزی خەوەکە', en: '🎙️ Play Hidden Bedside Voice Memo' },
      discoveryTitle: { ckb: 'تۆماری نهێنیی لەیلا لە ژووری خەو', en: 'Layla’s Midnight Bedroom Confession' },
      beats: [
        {
          speaker: 'layla',
          image: '/assets/layla_crimson.jpg',
          camera: 'intimate_zoom',
          effect: 'heartbeat',
          unlockCg: 'layla_crimson',
          text: {
            ckb: 'کاتێک تۆمارکەرە دەنگییەکەی تەنیشت سیسەمەکە دادەگیرسێنیت و گوێت لە چرپەی ناوی خۆت دەبێت، لەیلا بە جلی خەوی ئاوریشمی سوور و ڕۆبێکی مەخمەلییەوە دێتە ژوورەوە و لەسەر سیسەمەکە دادەنیشێت! «تەواو ئاشکرا بووم... بەڵێ، ئەو گۆرانییەم لە تاریکیدا تەنها بۆ تۆ تۆمار کردبوو. دەرگاکە دابخە و وەرە تەنیشتم.»',
            en: 'As her hushed voice plays from the bedside recorder, Layla enters in her crimson satin nightgown and velvet robe, blushing deeply on the bed: “Caught red-handed… lock the door and come sit beside me.”',
          },
        },
      ],
    },
  },
  {
    id: 'celine_room',
    floorLabel: '16F ROOM',
    mappedLoc: 'fireplace',
    privateOwner: 'celine',
    xPercent: 50,
    yPercent: 42,
    icon: '🔥',
    title: { ckb: 'ژووری تایبەتی سێلین و ئاگردان', en: 'Celine’s Private Suite (16F)' },
    sub: { ckb: 'ژووری خەوتن و دۆسیە نهێنییەکانی سێلین', en: 'Celine’s Quarters & Fireplace' },
    roomBg: '/assets/cover_keyart.jpg',
    secretObject: {
      label: { ckb: '📂 سەیرکردنی وێنە شاردراوەکەی تەنیشت سیسەمەکەی سێلین', en: '📂 Check Celine’s Bedside Keepsake' },
      discoveryTitle: { ckb: 'شڵەژانی سێلین لە ژووری خەوەکەیدا', en: 'Celine’s Bedroom Secret' },
      beats: [
        {
          speaker: 'celine',
          image: '/assets/celine_silk.jpg',
          camera: 'intimate_zoom',
          effect: 'heartbeat',
          unlockCg: 'celine_silk',
          text: {
            ckb: 'کاتێک سێلین بانگت دەکاتە ژوورەوە بۆ بینینی بەڵگەیەک، لەسەر سیسەمەکە بە جلی خەوی ئاوریشمی سپییەوە دانیشتووە و قژی هێشتا لە دوای خۆشتن شێدارە! خێرا هەوڵ دەدات وێنە کۆنەکەتان بشارێتەوە و ڕوومەتی دەسووتێت لە شەرمدا: «سـ-سەیری ئەوە مەکە! باشە... هێشتا هەموو شەوێک پێش خەوتن سەیری دەکەم!»',
            en: 'Fresh from an evening bath with damp silver hair, Celine sits on her bed in pearl-white silk nightwear, scrambling to hide an old photo of the two of you: “D-Don’t look at that! Fine… I still keep it beside my pillow every night!”',
          },
        },
      ],
    },
  },
  {
    id: 'sky_terrace',
    floorLabel: '15F GLASS',
    mappedLoc: 'balcony',
    xPercent: 49,
    yPercent: 56,
    icon: '🌧️',
    title: { ckb: 'باخچەی شوشەیی و باڵکۆن', en: '15F Rainlit Sky Terrace' },
    sub: { ckb: 'ژوانی نهێنی لەژێر باران', en: 'Botanical Glass Conservatory' },
    roomBg: '/assets/bg_balcony.jpg',
    secretObject: {
      label: { ckb: '🌿 گەڕان لە گۆشە تاریکەکەی باخچە شوشەییەکە', en: '🌿 Explore the Hidden Glass Alcove' },
      discoveryTitle: { ckb: 'ژوانی شاراوەی ژێر باران', en: 'Hidden Rainlit Alcove' },
      beats: [
        {
          speaker: 'celine',
          image: '/assets/celine_dress.jpg',
          camera: 'intimate_zoom',
          effect: 'warm_glow',
          unlockCg: 'celine_dress',
          text: {
            ckb: 'لە گۆشە تاریکەکەی پشت شوشە باراناوییەکەدا، سێلین بە عەزیی کۆرسێتی ڕەشەوە چاوەڕێت دەکات و یەخەی چاکەتەکەت ڕادەکێشێت: «پێم وابوو نایەیت... لێرە کەس ناتوانێت بمانبینێت.»',
            en: 'Behind the rain-misted ferns, Celine waits in her black corset dress, pulling you close by your collar: “Nobody can see us back here…”',
          },
        },
      ],
    },
  },
  {
    id: 'jazz_stage',
    floorLabel: '12F JAZZ',
    mappedLoc: 'lounge',
    xPercent: 50,
    yPercent: 70,
    icon: '🍸',
    title: { ckb: 'یانەی جاز و ژووری پشت شانۆ', en: '12F Jazz Lounge & Backstage' },
    sub: { ckb: 'مۆسیقا، باڕ و ژووری خۆگۆڕینی لەیلا', en: 'Stage, Bar & Dressing Room' },
    roomBg: '/assets/bg_lounge.jpg',
    secretObject: {
      label: { ckb: '🎹 لەدەرگادانی ژووری خۆگۆڕینی پشت شانۆ', en: '🎹 Knock on Layla’s Dressing Room' },
      discoveryTitle: { ckb: 'ژووری خۆگۆڕینی پشت شانۆ', en: 'Backstage Velvet Dressing Room' },
      beats: [
        {
          speaker: 'layla',
          image: '/assets/layla_swim.jpg',
          camera: 'intimate_zoom',
          effect: 'heartbeat',
          unlockCg: 'layla_swim',
          text: {
            ckb: 'لەیلا دەرگای ژووری پشت شانۆت لێ دەکاتەوە لە کاتێکدا خۆی گۆڕیوە بۆ بیکینییە سەوزەکە و زنجیرە زێڕینەکەی کەمەری بۆ چوونە سەربان! بە زەردەخەنەیەکی گەرمەوە پشتت تێدەکات: «وەرە قفڵی ئەم زنجیرەیەم بۆ ببەستە پێش ئەوەی بە دزییەوە سەربکەوین بۆ مەلەوانگەکەی سەربان...»',
            en: 'Layla lets you into her backstage room already dressed in her emerald bikini and gold waist chain: “Come fasten this chain for me before we sneak up to the rooftop pool…”',
          },
        },
      ],
    },
  },
  {
    id: 'grand_lobby',
    floorLabel: '1F LOBBY',
    mappedLoc: 'boutique',
    xPercent: 50,
    yPercent: 85,
    icon: '🛍️',
    title: { ckb: 'لۆبیی شاهانە و فرۆشگا', en: '1F Grand Lobby & Boutique' },
    sub: { ckb: 'کڕینی عەتر و دیاریی تایبەت', en: 'Luxury Gifts & Scents' },
    roomBg: '/assets/bg_lounge.jpg',
    secretObject: {
      label: { ckb: '🛎️ وەرگرتنی کارتی نهێنیی ئاسانسۆری سەربان', en: '🛎️ Collect VIP Rooftop Elevator Tip' },
      discoveryTitle: { ckb: 'نهێنیی ئاسانسۆری تایبەت', en: 'Private Elevator Access' },
      beats: [
        {
          speaker: 'narrator',
          image: '/assets/bg_lounge.jpg',
          camera: 'normal',
          text: {
            ckb: 'کارمەندی شەوانەی لۆبی بە چرپە پێت دەڵێت: «ئاسانسۆرە زێڕینەکەی لای چەپ ڕاستەوخۆ دەتباتە ژوورە تایبەتەکان و کەپری نهۆمی ١٨ بێ ئەوەی کەس پێت بزانێت.»',
            en: 'The night concierge whispers: “The private west elevator takes you straight to the private suites and the 18th-floor rooftop cabanas.”',
          },
        },
      ],
    },
  },
];
