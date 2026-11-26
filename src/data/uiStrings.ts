import { Locale, LocalizedText, SpeakerId } from '../types/story';

export const SPEAKER_META: Record<
  SpeakerId,
  { name: LocalizedText; color: string; badgeBg: string }
> = {
  narrator: {
    name: { ckb: 'گێڕەرەوە', en: 'Narrator' },
    color: '#e2d4f0',
    badgeBg: 'rgba(148, 130, 179, 0.22)',
  },
  you: {
    name: { ckb: 'تۆ', en: 'You' },
    color: '#93c5fd',
    badgeBg: 'rgba(59, 130, 246, 0.24)',
  },
  layla: {
    name: { ckb: 'لەیلا', en: 'Layla' },
    color: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.26)',
  },
  celine: {
    name: { ckb: 'سێلین', en: 'Celine' },
    color: '#f472b6',
    badgeBg: 'rgba(236, 72, 153, 0.26)',
  },
  both: {
    name: { ckb: 'لەیلا و سێلین', en: 'Layla & Celine' },
    color: '#fbbf24',
    badgeBg: 'rgba(245, 158, 11, 0.28)',
  },
};

export interface GalleryItem {
  id: string;
  image: string;
  title: LocalizedText;
  caption: LocalizedText;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'cover_keyart',
    image: '/assets/cover_keyart.jpg',
    title: { ckb: 'شەوی مەخمەلی لە نهۆمی ١٧', en: 'Midnight on the 17th Floor' },
    caption: {
      ckb: 'لەیلا و سێلین لەبەردەم تیشکی مۆم و برووسکەی زریانەکەدا.',
      en: 'Layla and Celine across candlelight as lightning splits the storm.',
    },
  },
  {
    id: 'layla_normal',
    image: '/assets/layla_normal.jpg',
    title: { ckb: 'نیگای یەکەمی لەیلا', en: "Layla's Emerald Gaze" },
    caption: {
      ckb: 'زەردەخەنەیەکی پڕ لە نهێنی لە هۆڵی مۆسیقای شەوانە.',
      en: 'A teasing smile steeped in secrets inside the velvet jazz lounge.',
    },
  },
  {
    id: 'celine_normal',
    image: '/assets/celine_normal.jpg',
    title: { ckb: 'گەڕانەوەی سێلین', en: "Celine's Unexpected Return" },
    caption: {
      ckb: 'دوای دوو ساڵ دابڕان لە پاریسەوە، لە پشتی پەنجەرە باراناوییەکان.',
      en: 'Two years after Paris, standing composed beside rain-streaked glass.',
    },
  },
  {
    id: 'layla_blush',
    image: '/assets/layla_blush.jpg',
    title: { ckb: 'چرپەی سەر پیانۆکە', en: 'Whispers Across the Piano' },
    caption: {
      ckb: 'کاتێک مەودای نێوانتان دەتوێتەوە و لێدانی دڵ خێراتر دەبێت.',
      en: 'When the distance melts away over flickering candlelight.',
    },
  },
  {
    id: 'celine_blush',
    image: '/assets/celine_blush.jpg',
    title: { ckb: 'تووانەوەی سەهۆڵ لەبەردەم ئاگردا', en: 'Ice Melting by the Fire' },
    caption: {
      ckb: 'یەکەم جار کە دەمامکە ساردەکەی سێلین دەشکێت.',
      en: "The moment Celine's cool armor finally gives way to longing.",
    },
  },
  {
    id: 'cg_layla_ending',
    image: '/assets/cg_layla_ending.jpg',
    title: { ckb: 'ئاگری ژێر باران (کۆتایی ڕاستەقینەی لەیلا)', en: 'Flame Beneath the Rain (Layla True CG)' },
    caption: {
      ckb: 'باڵکۆنی نهۆمی حەڤدەیەم؛ چاکەتەکەت لەسەر شانی و هەناسەیەکی گەرم لەژێر باران.',
      en: 'Your coat over her shoulders on the rain-misted terrace, one breath before a kiss.',
    },
  },
  {
    id: 'cg_celine_ending',
    image: '/assets/cg_celine_ending.jpg',
    title: { ckb: 'دوو ساڵ تامەزرۆیی (کۆتایی ڕاستەقینەی سێلین)', en: 'Two Years of Longing (Celine True CG)' },
    caption: {
      ckb: 'لەبەردەم گەرمیی ئاگردانەکە؛ کاتێک چیتر هیچ نهێنییەک نامێنێتەوە.',
      en: 'Held close by the fireplace as two years of silence turn into passion.',
    },
  },
  {
    id: 'cg_double_ending',
    image: '/assets/cg_double_ending.jpg',
    title: { ckb: 'بەرەبەیانی دوو گەردەلوول (کۆتایی نهێنی)', en: 'Dawn of Two Storms (Secret CG)' },
    caption: {
      ckb: 'خۆرهەڵاتی پەمەیی و زێڕین؛ کاتێک هیچ کامیان دەستبەردارت نابن.',
      en: 'Pink-and-gold sunrise in the penthouse when neither woman lets you go.',
    },
  },
];

export const UI_TEXT = {
  gameTitle: {
    ckb: 'شەوی مەخمەلی',
    en: 'Midnight Velvet',
  },
  gameSubtitle: {
    ckb: 'نهێنی و ڕۆمانسی نهۆمی حەڤدەیەم',
    en: 'Secrets & Romance on the 17th Floor',
  },
  tagline: {
    ckb: 'زریانێکی نیوەشەو، ئەڵماسێکی ونبوو، و دوو ئافرەت کە هەر یەکەیان بە شێوازێک دڵت دەخاتە لەرزە...',
    en: 'A midnight storm, a vanished ruby, and two captivating women pulling you into an intoxicating game of trust and desire.',
  },
  newGame: { ckb: 'دەستپێکردنی چیرۆک', en: 'Start New Story' },
  continueGame: { ckb: 'بەردەوامبوون', en: 'Continue' },
  saves: { ckb: 'خەزنکردن', en: 'Save / Load' },
  gallery: { ckb: 'ئەلبووم و کۆتاییەکان', en: 'CG & Endings' },
  studio: { ckb: 'ستۆدیۆی دیمەن', en: 'Scene Studio' },
  backlog: { ckb: 'مێژوو', en: 'Log' },
  auto: { ckb: 'ئۆتۆ', en: 'Auto' },
  skip: { ckb: 'خێرا', en: 'Skip' },
  stats: { ckb: 'پەیوەندییەکان', en: 'Chemistry' },
  home: { ckb: 'سەرەتا', en: 'Title' },
  tapToContinue: { ckb: 'کلیک بکە بۆ بەردەوامبوون...', en: 'Tap anywhere to continue...' },
  laylaStat: { ckb: 'لەیلا', en: 'Layla' },
  celineStat: { ckb: 'سێلین', en: 'Celine' },
  chemistryStat: { ckb: 'گەرمی و کشش', en: 'Chemistry' },
  trustStat: { ckb: 'متمانە', en: 'Trust' },
  boldnessStat: { ckb: 'بوێری', en: 'Boldness' },
  autosaveLabel: { ckb: 'خەزنی ئۆتۆماتیکی', en: 'Autosave' },
  slotLabel: { ckb: 'شوێنی خەزن', en: 'Save Slot' },
  saveBtn: { ckb: 'خەزن بکە', en: 'Save Here' },
  loadBtn: { ckb: 'بیخوێنەوە', en: 'Load' },
  emptySlot: { ckb: 'بەتاڵە', en: 'Empty Slot' },
  close: { ckb: 'داخستن', en: 'Close' },
  lockedCg: { ckb: 'داخراوە — لە ناو چیرۆکەکەدا بیدۆزەرەوە', en: 'Locked — Unlock during story routes' },
  endingsTab: { ckb: 'کۆتاییەکان (٥)', en: 'Endings (5)' },
  cgTab: { ckb: 'وێنە تایبەتەکان (٨)', en: 'CG Artworks (8)' },
  playAgain: { ckb: 'دووبارە یاریکردن بۆ کۆتاییەکی تر', en: 'Play Again for Another Route' },
  loadLastChoice: { ckb: 'گەڕانەوە بۆ دواهەڵبژاردن', en: 'Return to Last Crossroads' },
  hintsOn: { ckb: 'نیشاندانی کاریگەریی هەڵبژاردن: چالاکە', en: 'Choice Tone Hints: ON' },
  hintsOff: { ckb: 'نیشاندانی کاریگەریی هەڵبژاردن: ناچالاکە', en: 'Choice Tone Hints: OFF' },
  studioTitle: { ckb: 'ستۆدیۆی مۆبایل — دروستکردنی دیمەنی تایبەت', en: 'Mobile Scene Studio — Custom Scene' },
  studioDesc: {
    ckb: 'دەتوانیت ڕاستەوخۆ لەسەر مۆبایلەکەت دیمەن و وێنە و دیالۆگی تایبەت بە خۆت زیاد بکەیت و تاقی بکەیتەوە یان وەک فایلی JSON دایبەزێنیت.',
    en: 'Create and test your own custom scene with photos from your phone gallery, custom dialogue, and effects.',
  },
};

export function t(text: LocalizedText, locale: Locale): string {
  return text[locale];
}
