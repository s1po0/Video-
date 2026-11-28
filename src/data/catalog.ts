import {
  GiftItem,
  GiftTag,
  HeroineId,
  Locale,
  LocalizedText,
  LocationId,
  MoodType,
  ReplyStyle,
  TimePhase,
} from '../types/game';

export const RANK_THRESHOLDS = [0, 25, 60, 105, 155];

export function computeRank(affection: number): number {
  let r = 1;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (affection >= RANK_THRESHOLDS[i]) r = i + 1;
  }
  return r;
}

export const RANK_TITLES: Record<number, LocalizedText> = {
  1: { ckb: 'ئاشنای شەو', en: 'Midnight Acquaintance' },
  2: { ckb: 'بریسکەی سەرنج', en: 'Electric Spark' },
  3: { ckb: 'کششی نهێنی', en: 'Secret Tension' },
  4: { ckb: 'شەیدای دڵ', en: 'Deep Obsession' },
  5: { ckb: 'خۆشەویستی ئاگرین', en: 'Passionate Lover' },
};

export const PHASE_NAMES: Record<TimePhase, { icon: string; name: LocalizedText }> = {
  0: { icon: '🌆', name: { ckb: 'سەرەتای شەو (٢٠:٠٠)', en: 'Evening (8:00 PM)' } },
  1: { icon: '🌙', name: { ckb: 'شەوی درەنگ (٢٢:٣٠)', en: 'Late Night (10:30 PM)' } },
  2: { icon: '🔥', name: { ckb: 'نیوەشەو (٠٠:٣٠)', en: 'Midnight (12:30 AM)' } },
  3: { icon: '🌌', name: { ckb: 'پێش بەرەبەیان (٠٢:٣٠)', en: 'After-Hours (2:30 AM)' } },
};

export const MOOD_META: Record<
  MoodType,
  { icon: string; label: LocalizedText; bestStyle: ReplyStyle; color: string }
> = {
  flirty: {
    icon: '😉',
    label: { ckb: 'شۆخ و نازدار', en: 'Flirty' },
    bestStyle: 'playful',
    color: '#f472b6',
  },
  heated: {
    icon: '🔥',
    label: { ckb: 'گەرم و تامەزرۆ', en: 'Heated' },
    bestStyle: 'bold',
    color: '#fb7185',
  },
  vulnerable: {
    icon: '🥺',
    label: { ckb: 'هەستیار و نەرم', en: 'Vulnerable' },
    bestStyle: 'tender',
    color: '#93c5fd',
  },
  jealous: {
    icon: '😤',
    label: { ckb: 'بەغیل و گرژ', en: 'Jealous' },
    bestStyle: 'tender',
    color: '#fbbf24',
  },
  radiant: {
    icon: '✨',
    label: { ckb: 'درەوشاوە و دڵخۆش', en: 'Radiant' },
    bestStyle: 'bold',
    color: '#34d399',
  },
};

export interface HeroineProfile {
  id: HeroineId;
  name: LocalizedText;
  role: LocalizedText;
  color: string;
  avatar: string;
  blushArt: string;
  endingCg: string;
  bio: LocalizedText;
  lovedTags: GiftTag[];
  likedTags: GiftTag[];
  dislikedTags: GiftTag[];
  schedule: Record<TimePhase, LocationId>;
  giftReactions: {
    loved: LocalizedText;
    liked: LocalizedText;
    disliked: LocalizedText;
  };
}

export const HEROINES: Record<HeroineId, HeroineProfile> = {
  layla: {
    id: 'layla',
    name: { ckb: 'لەیلا', en: 'Layla' },
    role: { ckb: 'گۆرانیبێژی جاز و میراتگری نهێنی', en: 'Velvet Jazz Singer & Heiress' },
    color: '#34d399',
    avatar: '/assets/layla_normal.jpg',
    blushArt: '/assets/layla_blush.jpg',
    endingCg: '/assets/cg_layla_ending.jpg',
    bio: {
      ckb: 'جوانییەکی سیحراوی بە عەزیی مەخمەلیی سەوزەوە. حەزی لە بوێری، مۆسیقای شەوانە، بۆنی عەتر و نزیکبوونەوەی بێترسە — بەڵام لە ناخیدا بەدوای متمانەیەکی ڕاستەقینەدا دەگەڕێت بۆ گەڕاندنەوەی ملوانکەی دایکی.',
      en: 'Captivating in emerald velvet. Drawn to bold eye contact, vinyl jazz, rare scents, and fearless closeness—while secretly fighting to reclaim her late mother’s stolen ruby.',
    },
    lovedTags: ['music', 'scent', 'intimate'],
    likedTags: ['luxury', 'sweet'],
    dislikedTags: ['paris'],
    schedule: {
      0: 'lounge',
      1: 'balcony',
      2: 'lounge',
      3: 'suite',
    },
    giftReactions: {
      loved: {
        ckb: 'چاوە کەهرەباییەکانی لەیلا دەدرەوشێنەوە؛ دەستت دەگرێت و لێوی نزیکی گوێت دەکاتەوە: «چۆن زانیت ئەمە خاڵی لاوازی منە؟ ئەمشەو پاداشتەکەت زۆر تایبەت دەبێت...»',
        en: 'Layla’s amber eyes light up; she catches your wrist and leans close to your ear: “How did you know my exact weakness? Tonight I owe you something unforgettable…”',
      },
      liked: {
        ckb: 'بە زەردەخەنەیەکی گەرمەوە دیارییەکە لە سنگیدا دەگرێت: «سەلیقەت نایابە... وا دەکەیت زیاتر بیرت لێ بکەمەوە.»',
        en: 'She holds the gift close with a slow, appreciative smile: “Impeccable taste… you’re making it hard to behave around you.”',
      },
      disliked: {
        ckb: 'برۆیەکی بەرز دەکاتەوە بە بزەیەکی سارد: «پێم وابێ ئەمەت بۆ کەسێکی تر کڕیوە نەک من، وایە؟»',
        en: 'She arches a playful yet unimpressed brow: “Sure you didn’t buy this with someone else in mind?”',
      },
    },
  },
  celine: {
    id: 'celine',
    name: { ckb: 'سێلین', en: 'Celine' },
    role: { ckb: 'لێکۆڵەری تایبەت و خۆشەویستە کۆنەکەت', en: 'Private Investigator & Ex-Flame' },
    color: '#f472b6',
    avatar: '/assets/celine_normal.jpg',
    blushArt: '/assets/celine_blush.jpg',
    endingCg: '/assets/cg_celine_ending.jpg',
    bio: {
      ckb: 'لە ڕووکەشدا سارد و فەرمی، بەڵام یادگاریی شەوە باراناوییەکەی پاریس هێشتا وەک پشکۆ لە دڵیدایە. حەزی لە قاوەی تاڵ، نهێنی، یادگاریی پاریس و دەربڕینی ڕاستگۆیانەیە.',
      en: 'Cool and composed on duty, yet your unforgettable summer in Paris still burns beneath her armor. Loves Parisian keepsakes, mystery clues, and fierce honesty.',
    },
    lovedTags: ['paris', 'mystery', 'intimate'],
    likedTags: ['sweet', 'scent'],
    dislikedTags: ['mixology'],
    schedule: {
      0: 'fireplace',
      1: 'lounge',
      2: 'fireplace',
      3: 'balcony',
    },
    giftReactions: {
      loved: {
        ckb: 'ڕوومەتەکانی سێلین سوور هەڵدەگەڕێن و پەنجەکانی دەلەرزن: «هێشتا... هێشتا لەبیرت ماوە حەزم لە چییە؟ وا مەکە لێرەدا هەموو دیوارەکانم بڕووخێن...»',
        en: 'A deep blush rushes across Celine’s cheeks as her fingers tremble: “You… still remember what I loved most? Stop looking at me like that before I lose all composure…”',
      },
      liked: {
        ckb: 'سێلین بە شەرمێکی ناسکەوە سەری نزم دەکاتەوە: «سوپاس... لە گیرفانی چاکەتەکەمدا لای دڵم هەڵیدەگرم.»',
        en: 'She tucks it carefully inside her burgundy blazer with a soft, lingering glance: “Thank you… I’ll keep it close tonight.”',
      },
      disliked: {
        ckb: 'بە ساردی هەناسەیەک هەڵدەکێشێت: «من لە کاتی ئەرکدام، پێویستم بەم شتانە نییە.»',
        en: 'She exhales coolly: “I’m on an investigation—save flashy party tricks for someone else.”',
      },
    },
  },
  aria: {
    id: 'aria',
    name: { ckb: 'ئاریا', en: 'Aria' },
    role: { ckb: 'خاوەنی مەلەوانگەی سەربان و میکسۆلۆجیست', en: '18th-Floor Rooftop Pool & Cabana Hostess' },
    color: '#fbbf24',
    avatar: '/assets/aria_normal.jpg',
    blushArt: '/assets/aria_blush.jpg',
    endingCg: '/assets/cg_aria_ending.jpg',
    bio: {
      ckb: 'ئافرەتێکی پڕ لە وزە، شۆخ و سەرنجڕاکێش بە عەزیی ڕەش و زێڕینەوە لە نهۆمی ١٨. هەموو نهێنیی میوانە دەوڵەمەندەکان دەزانێت و حەزی لە سەرکێشی، خواردنەوەی نایاب و شەوانی ناو کەپری مەلەوانگەکەیە.',
      en: 'Radiant, daring, and magnetic in black-and-gold silk on the 18th-floor infinity pool deck. Knows every VIP secret in the hotel and loves luxury, bold dares, and private cabana nights.',
    },
    lovedTags: ['mixology', 'luxury', 'intimate'],
    likedTags: ['scent', 'music'],
    dislikedTags: ['mystery'],
    schedule: {
      0: 'pool',
      1: 'pool',
      2: 'balcony',
      3: 'pool',
    },
    giftReactions: {
      loved: {
        ckb: 'ئاریا بە جۆشەوە قۆڵەکانی لە دەوری گەردنت دەئاڵێنێت و لە بن گوێتدا دەچرپێنێت: «تەواو دڵمت برد! وەرە ناو کەپرە تایبەتەکەی لای مەلەوانگەکە با بە تەنها بین...»',
        en: 'Aria loops her arms warmly around your shoulders, whispering against your cheek: “Okay, you officially stole my night! Come into my private cabana by the pool…”',
      },
      liked: {
        ckb: 'چاوە سەوز-قاوەییەکانی دەبریسکێنەوە: «ئۆهـ، زۆر شیرینە! دەزانیت چۆن دڵی کچێک خۆش بکەیت.»',
        en: 'Her hazel-green eyes sparkle warmly: “Oh, I love this! You really know how to spoil a woman.”',
      },
      disliked: {
        ckb: 'بە شۆخییەوە لێوی خوار دەکاتەوە: «شتێکی فەرمی و وشک؟ من حەزم لە خۆشی و گەرمییە نەک دۆسیەی پۆلیسی!»',
        en: 'She pouts playfully: “Something so serious? Bring me sparkle and heat next time!”',
      },
    },
  },
};

export interface LocationMeta {
  id: LocationId;
  icon: string;
  name: LocalizedText;
  subtitle: LocalizedText;
  image: string;
}

export const LOCATIONS: LocationMeta[] = [
  {
    id: 'lounge',
    icon: '🍸',
    name: { ckb: 'هۆڵی جازی مەخمەلی', en: 'Velvet Jazz Lounge' },
    subtitle: { ckb: 'مۆسیقا، پیانۆ و کارکردن لە باڕ (+پارە)', en: 'Piano, Velvet Bar & Mixology Shift (+$$)' },
    image: '/assets/bg_lounge.jpg',
  },
  {
    id: 'pool',
    icon: '🌊',
    name: { ckb: 'مەلەوانگەی گەرمی نهۆمی ١٨', en: '18F Heated Infinity Pool' },
    subtitle: { ckb: 'هەڵمی گەرم، کەپری تایبەت و پشوودان', en: 'Warm Mist, Private Cabanas & Night Swim' },
    image: '/assets/bg_pool.jpg',
  },
  {
    id: 'fireplace',
    icon: '🔥',
    name: { ckb: 'ژووری ئاگردان و نهێنییەکان', en: 'Fireplace & Archive Room' },
    subtitle: { ckb: 'گفتوگۆی قووڵ و گەڕان بەدوای بەڵگەی یاقووت', en: 'Intimate Talks & Ruby Clue Investigation' },
    image: '/assets/cover_keyart.jpg',
  },
  {
    id: 'balcony',
    icon: '🌧️',
    name: { ckb: 'باڵکۆنی ئاسمانی لەژێر باران', en: 'Rain-Misted Sky Terrace' },
    subtitle: { ckb: 'ژوان و نزیکبوونەوەی ڕۆمانسی لەبەر فانۆس', en: 'High-Romance Lantern Dates & Stargazing' },
    image: '/assets/bg_balcony.jpg',
  },
  {
    id: 'boutique',
    icon: '🛍️',
    name: { ckb: 'فرۆشگای دیاریی نیوەشەو', en: 'Midnight Luxury Boutique' },
    subtitle: { ckb: 'کڕینی عەتر و دیاری بۆ بردنەوەی دڵیان (بێ وزە)', en: 'Buy Luxury Gifts & Scents (0 Energy)' },
    image: '/assets/bg_lounge.jpg',
  },
  {
    id: 'suite',
    icon: '🛏️',
    name: { ckb: 'سویتی تایبەتی ١٧٠٩', en: 'VIP Penthouse Suite 1709' },
    subtitle: { ckb: 'میوانداریی تایبەتی درەنگانی شەو و خەوتن', en: 'Private Late-Night Invites & Rest to Next Night' },
    image: '/assets/bg_penthouse.jpg',
  },
];

export const GIFTS_CATALOG: GiftItem[] = [
  {
    id: 'velvet_perfume',
    icon: '🌸',
    name: { ckb: 'عەتری ڤانێلا و عەنبەر', en: 'Noir Vanilla & Amber Perfume' },
    desc: { ckb: 'بۆنێکی گەرم و سەرنجڕاکێش بۆ شەوانی نزیک.', en: 'Warm, intoxicating night fragrance.' },
    price: 120,
    tags: ['scent', 'luxury'],
  },
  {
    id: 'vinyl_jazz',
    icon: '🎵',
    name: { ckb: 'قەوانی دەگمەنی جازی شەوانە', en: 'Rare Midnight Jazz Vinyl' },
    desc: { ckb: 'ئاوازی خاو بۆ سەمای دووقۆڵی لە تاریکیدا.', en: 'Slow, sensual melodies made for slow dancing.' },
    price: 140,
    tags: ['music', 'intimate'],
  },
  {
    id: 'paris_chocolates',
    icon: '🍫',
    name: { ckb: 'شۆکۆلاتەی تاڵی پاریسی', en: 'Parisian Artisanal Truffles' },
    desc: { ckb: 'یادگاریی کافێ بچووکەکانی ژێر بارانی پاریس.', en: 'A nostalgic taste of rainy Parisian nights.' },
    price: 110,
    tags: ['paris', 'sweet'],
  },
  {
    id: 'silver_cipher',
    icon: '🗝️',
    name: { ckb: 'کلیلی کۆدی ئەرشیفی کۆن', en: 'Engraved Silver Vault Key' },
    desc: { ckb: 'بەڵگەیەکی گرنگ بۆ ئاشکراکردنی نهێنییەکان.', en: 'Intricate keepsake loved by sharp investigators.' },
    price: 150,
    tags: ['mystery', 'paris'],
  },
  {
    id: 'gold_shaker',
    icon: '🥂',
    name: { ckb: 'شەربەتی کریستاڵی زێڕین', en: '24K Gold Crystal Elixir' },
    desc: { ckb: 'خواردنەوەیەکی شاهانەی بێکهول بە تامی هەنار و گوڵ.', en: 'Sparkling pomegranate-rose reserve.' },
    price: 135,
    tags: ['mixology', 'luxury'],
  },
  {
    id: 'silk_robe_wrap',
    icon: '🧣',
    name: { ckb: 'شالی ئاوریشمی مەخمەلی', en: 'Crimson Silk Evening Wrap' },
    desc: { ckb: 'دیارییەکی زۆر تایبەت و گەرم بۆ درەنگانی شەو.', en: 'Soft, intimate silk wrap for chilly balcony nights.' },
    price: 220,
    tags: ['intimate', 'luxury', 'scent'],
  },
];

export const GALLERY_CGS: {
  id: string;
  image: string;
  title: LocalizedText;
}[] = [
  { id: 'cover_keyart', image: '/assets/cover_keyart.jpg', title: { ckb: 'شەوی یەکەم لە نهۆمی ١٧', en: 'First Night on Floor 17' } },
  { id: 'layla_normal', image: '/assets/layla_normal.jpg', title: { ckb: 'زەردەخەنەی سەوزی لەیلا', en: 'Layla in Emerald Velvet' } },
  { id: 'celine_normal', image: '/assets/celine_normal.jpg', title: { ckb: 'گەڕانەوەی سێلین', en: 'Celine by the Rainy Glass' } },
  { id: 'aria_normal', image: '/assets/aria_normal.jpg', title: { ckb: 'ئاریا لە مەلەوانگەی سەربان', en: 'Aria at the Infinity Pool' } },
  { id: 'layla_blush', image: '/assets/layla_blush.jpg', title: { ckb: 'چرپەی لەیلا لەسەر پیانۆ', en: 'Layla’s Candlelit Blush' } },
  { id: 'celine_blush', image: '/assets/celine_blush.jpg', title: { ckb: 'تووانەوەی دڵی سێلین', en: 'Celine’s Melted Armor' } },
  { id: 'aria_blush', image: '/assets/aria_blush.jpg', title: { ckb: 'شەوی کەپری تایبەتی ئاریا', en: 'Aria in the Misty Cabana' } },
  { id: 'cg_suite_date', image: '/assets/cg_suite_date.jpg', title: { ckb: 'ژوانی درەنگانی شەو لە سویتی ١٧٠٩', en: 'Late-Night Suite 1709 Intimacy' } },
  { id: 'cg_layla_ending', image: '/assets/cg_layla_ending.jpg', title: { ckb: 'ماچی ژێر باران — لەیلا', en: 'Rain-Soaked Balcony Kiss — Layla' } },
  { id: 'cg_celine_ending', image: '/assets/cg_celine_ending.jpg', title: { ckb: 'باوەشی بەردەم ئاگر — سێلین', en: 'Fireside Embrace — Celine' } },
  { id: 'cg_aria_ending', image: '/assets/cg_aria_ending.jpg', title: { ckb: 'ئەفسوونی نیوەشەو — ئاریا', en: 'Cabana Midnight Kiss — Aria' } },
  { id: 'cg_double_ending', image: '/assets/cg_double_ending.jpg', title: { ckb: 'بەرەبەیانی زێڕین (کۆتایی شاهانە)', en: 'Golden Penthouse Dawn (Crown CG)' } },
];

export function loc(item: LocalizedText, locale: Locale): string {
  return item[locale];
}
