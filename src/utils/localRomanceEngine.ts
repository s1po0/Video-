import { HEROINE_OUTFITS } from '../data/outfits';
import { GameState, HeroineId, Locale } from '../types/game';

type IntentKey =
  | 'kiss'
  | 'embrace'
  | 'room'
  | 'outfit'
  | 'spa_pool'
  | 'love'
  | 'photo'
  | 'status'
  | 'general';

function detectUserIntent(text: string): IntentKey {
  const t = text.toLowerCase();
  if (/ماچ|لێو|گەردن|kiss|lips|neck/.test(t)) return 'kiss';
  if (/باوەش|دەست|توند|کەمەر|گەرم|نزیک|touch|hold|hug|waist|close/.test(t)) return 'embrace';
  if (/ژوور|دەرگا|سیسەم|دێم|وەرە|بخەو|room|door|bed|coming|come/.test(t)) return 'room';
  if (/جل|پۆشاک|ڕۆب|جوان|سوور|چیت لەبەرە|wear|outfit|dress|hot|beautiful/.test(t)) return 'outfit';
  if (/مەلەوانگە|ئاو|حەمام|شاوەر|هەڵم|سەربان|pool|water|bath|shower|steam|rooftop/.test(t)) return 'spa_pool';
  if (/خۆشم|بیرت|عەشق|دڵم|تەنها|شێت|love|miss|heart|mine|only/.test(t)) return 'love';
  if (/وێنە|سێڵفی|ڕەسم|ai-snap|photo|pic|snap|selfie/.test(t)) return 'photo';
  if (/چۆنی|لەکوێی|چی دەکەی|سڵاو|چۆنیت|hello|hi|where|doing/.test(t)) return 'status';
  return 'general';
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function generateContextualRomanceReply(params: {
  heroineId: HeroineId;
  userText: string;
  historyCount: number;
  state: GameState;
  locale: Locale;
  contextMode: 'phone' | 'scene';
  outfitId?: string;
}): string {
  const { heroineId, userText, historyCount, state, locale, contextMode, outfitId } = params;
  const intent = detectUserIntent(userText);
  const outfitList = HEROINE_OUTFITS[heroineId];
  const outfit = outfitList.find((o) => o.id === outfitId) || outfitList[0];
  const h = hashStr(`${userText}-${historyCount}-${state.heroines[heroineId].desire}`);

  if (locale !== 'ckb') {
    const enOpeners: Record<HeroineId, string[]> = {
      layla: [
        `Layla lets the crimson silk of her ${outfit.name.en} slip slightly off one warm shoulder in the candlelit room, her amber eyes locking onto yours.`,
        `Tracing a slow fingertip down your collar, Layla steps closer until the scent of vanilla and midnight rain wraps around you.`,
      ],
      celine: [
        `A deep flush rises across Celine's collarbone in her ${outfit.name.en}; her cool composure melts the second she hears your voice.`,
        `Celine catches your wrist with trembling fingers, her silver-blonde hair brushing your shoulder by the firelight.`,
      ],
      aria: [
        `Aria draws the silk cabana curtain shut in her ${outfit.name.en}, leaning against your chest with a fearless, heated smile.`,
        `Warm mist curls off the rooftop water as Aria tangles her fingers gently at the nape of your neck.`,
      ],
    };
    const enSpoken: Record<IntentKey, string> = {
      kiss: `“Sipan… don’t just talk about my lips when you’re this close. Tilt my chin up and kiss me properly tonight.”`,
      embrace: `“Hold me tighter, Sipan. Feel how fast my heart beats every time your hands touch my waist…”`,
      room: `“The door is already unlocked for you, Sipan. Step inside and lock the rest of the hotel out for tonight.”`,
      outfit: `“I put this ${outfit.name.en} on hoping only your eyes would see it tonight, Sipan… come closer and tell me what you think.”`,
      spa_pool: `“The warm water and rising steam feel incredible, Sipan… come join me before the night cools down.”`,
      love: `“Every word you say pulls me deeper, Sipan. Tonight there’s nobody else in this tower—just you and me.”`,
      photo: `“I took this private shot just for your eyes, Sipan… now stop staring at your screen and come see me in person.”`,
      status: `“I was right here waiting for your message, Sipan, counting the minutes until you walked through my door.”`,
      general: `“You always know exactly how to make me lose my breath, Sipan… stay right here beside me all night.”`,
    };
    return `${enOpeners[heroineId][h % 2]}\n\n${enSpoken[intent]}`;
  }

  const outfitNameCkb = outfit.name.ckb;
  const openers: Record<HeroineId, string[]> = {
    layla: [
      `لەیلا لەبەر ڕووناکیی زەردی مۆمەکاندا بە «${outfitNameCkb}»ـەوە هەنگاوێکی نەرم و وروژێنەر دێتە پێشەوە؛ نیگا گەرمەکەی لەسەر چاوەکانت جێگیر دەکات و بۆنی عەترە شەوانەکەی تێکەڵی هەناسەت دەبێت.`,
      `زەردەخەنەیەکی قووڵ و پڕ لە ناز دەکەوێتە سەر لێوە سوورەکانی لەیلا؛ قوماشی «${outfitNameCkb}» بە نەرمی بەسەر شانیدا دەخزێت و پەنجە گەرمەکانی دەخاتە سەر سنگت.`,
      `لەیلا قژە شەپۆلدارەکەی دەخاتە سەر یەک شانی و لەسەر لێواری قەنەفە مەخمەلییەکەوە بە نیگایەکی پڕ لە ئاگر و تامەزرۆیی سەیرت دەکات.`,
    ],
    celine: [
      `سێلین هەر کە گوێی لە قسەکەت دەبێت، سووربوونەوەیەکی گەرم بەسەر گەردن و ڕوومەتەکانیدا بڵاو دەبێتەوە؛ لە ناو «${outfitNameCkb}»ـدا هەناسەیەکی قووڵ و لەرزۆک هەڵدەکێشێت و لێت نزیک دەبێتەوە.`,
      `چاوە بنەوشەییەکانی سێلین لەبەر تیشکی ئاگردانەکەدا دەبریسکێنەوە؛ ساردوسڕییەکەی بە تەواوی دەتوێتەوە و بە هەردوو دەستی یەخەی کراسەکەت دەگرێت.`,
      `سێلین بە شەرمێکی تێکەڵ بە عەشقێکی قووڵەوە تاڵێک لە قژە زیوینەکەی دەباتە پشت گوێی و سەری بە نەرمی بە شانتەوە دەنووسێنێت.`,
    ],
    aria: [
      `ئاریا لە ناو کەشە گەرم و هەڵماوییەکەی سەرباندا بە «${outfitNameCkb}»ـەوە پەردە ئاوریشمییەکە دادەداتەوە و بە پێکەنینێکی شۆخ و بێترسەوە هێندە لێت نزیک دەبێتەوە گەرمیی جەستەی هەست پێ دەکەیت.`,
      `ئاریا جامە کریستاڵەکەی دادەنێت، بە چاوە هەنگوینییە درەوشاوەکانییەوە سەیرت دەکات و قۆڵەکانی بە نەرمی لە دەوری گەردنت دەئاڵێنێت.`,
      `لە ژێر ڕووناکیی مانگ و شەپۆلی ئاوە گەرمەکەی نهۆمی ١٨دا، ئاریا بە «${outfitNameCkb}»ـەوە دەستت ڕادەکێشێت بۆ سەر سەرینە نەرمەکانی کەپرە تایبەتەکەی.`,
    ],
  };

  const intentReplies: Record<IntentKey, Record<HeroineId, string[]>> = {
    kiss: {
      layla: [
        `لێوی دەهێنێتە تەنیشت گوێت و بە چرپەیەکی گەرم دەڵێت: «سیپان... کە باسی لێو و ماچ دەکەیت، دڵم لە سینەمدا ئاگر دەگرێت. چەناگەم بەرز بکەرەوە و مەهێڵە چیتر چاوەڕێ بم.»`,
        `پەنجەیەک بە نەرمی لەسەر لێوت دادەنێت: «تامی یەک ماچی تۆ لە هەموو گۆرانییەکانی ئەمشەو شیرینترە سیپان... وەرە پێشتر و بێدەنگم بکە بە لێوەکانت.»`,
      ],
      celine: [
        `بە دەنگێکی نزم و لەرزۆکەوە دەچرپێنێت: «سیپان... لە شەوی پاریسەوە تامی لێوەکانت لە یادم نەچووەتەوە. ئەمشەو مەپرسە، تەنها لە باوەشم بگرە و ماچم بکە.»`,
        `چاوەکانی دادەخات و سەری بەرز دەکاتەوە بۆت: «کاتێک وا نزیکیت سیپان، هەموو بەرگرییەکانم دەڕووخێن... لێوم تەنها هی تۆیە ئەمشەو.»`,
      ],
      aria: [
        `لێوی خوارەوەی دەگەزێت و بە زەردەخەنەیەکی وروژێنەرەوە دەڵێت: «ئۆهـ سیپان، دەتەوێت تاقیم بکەیتەوە؟ وەرە بزانم ماچەکەت هێندەی قسەکانت گەرم و بێباکە یان نا!»`,
        `گەردنت بەرەو خۆی ڕادەکێشێت: «لێرە لە پشتی ئەم پەردە ئاوریشمییەوە کەس نامانبینێت سیپان... بە دڵی خۆت ماچم بکە.»`,
      ],
    },
    embrace: {
      layla: [
        `دەستەکانت دەباتە سەر کەمەری خۆی: «توندتر بمگرە سیپان... حەز دەکەم گەرمیی دەستەکانت لەسەر ئەم جلە ئاوریشمییەم هەست پێ بکەم تا بەیانی.»`,
      ],
      celine: [
        `خۆی دەشارێتەوە لە ناو باوەشتدا: «تەنها لە ناو قۆڵەکانی تۆدا هەست بە ئارامی و گڕگرتن دەکەم پێکەوە سیپان... تکایە بەرم مەدە.»`,
      ],
      aria: [
        `خۆی بە سنگتەوە دەنووسێنێت: «ببینە دڵم چەند خێرا لێدەدات سیپان! باوەشی تۆ لە ئاوی گەرمی جاکوزییەکەش خۆشترە.»`,
      ],
    },
    room: {
      layla: [
        `کلیلی ژوورەکەی لەسەر مێزەکە دادەنێت: «دەرگای سویتەکەم بۆ تۆ کراوەتەوە سیپان... مۆمەکانم داگیرساندووە و ئەمشەو ناهێڵم تا بەیانی لە ژوورەکەم بچیتە دەرەوە.»`,
      ],
      celine: [
        `دەستت ڕادەکێشێت بەرەو ژوورەوە: «وەرە ژوورەوە و دەرگاکە دابخە سیپان... ئەمشەو نەمەوێت هیچ کەسێکی تر لەم هۆتێلەدا بزانێت پێکەوەین.»`,
      ],
      aria: [
        `پێدەکەنێت و پەنجە بۆ کەپرە تایبەتەکەی سەربان ڕادەکێشێت: «هەموو نهۆمی ١٨م بۆ خۆمان چۆڵ کردووە سیپان! خێرا وەرە ژوورەوە با شەوەکەمان دەست پێ بکات.»`,
      ],
    },
    outfit: {
      layla: [
        `بە هێواشی لەبەردەمتدا دەسووڕێتەوە: «ئەم «${outfitNameCkb}»ـەم تەنها لەبەر خاتری چاوەکانی تۆ پۆشیوە سیپان... پێت چۆنە؟ حەز دەکەم لە نزیکترەوە سەیری بکەیت.»`,
      ],
      celine: [
        `کەمێک ڕوومەتی سوور دەبێتەوە و دەست بە قەراغی جلەکەیدا دەهێنێت: «دەمزانی سەرنجی «${outfitNameCkb}» دەدەیت سیپان... تەنها بۆ تۆ بوێریم کرد ئەمشەو ئەمە لەبەر بکەم.»`,
      ],
      aria: [
        `چاوێکت لێ دادەگرێت: «ئەم «${outfitNameCkb}»ـەم تایبەت بۆ شەوانی سەربان هەڵبژاردووە سیپان! دەزانم ناتوانیت چاوت لەسەرم لابەریت.»`,
      ],
    },
    spa_pool: {
      layla: [
        `پەنجە بە هەڵمە گەرمەکەدا دەهێنێت: «ئاوی گوڵ و هەڵمە چڕەکەی حەمامەکە ئامادەیە سیپان... وەرە لەسەر لێوارە مەڕمەڕییەکە لە تەنیشتم دانیشە.»`,
      ],
      celine: [
        `خاولیە گەرمەکە توندتر دەگرێت بە سنگییەوە: «هەڵمی شاوەرەکە هەموو شتێکی لێڵ کردووە سیپان... دەنگت لە پشتی شووشە تەماوییەکەوە تەزووی گەرم بە لەشمدا دەهێنێت.»`,
      ],
      aria: [
        `دەست بە ئاوە شەپۆلدار و گەرمەکەدا دەهێنێت: «ئاوی مەلەوانگەی سەربان و کەفی جاکوزییەکە زۆر گەرمە سیپان! وەرە ناو ئاوەکە بۆ لام.»`,
      ],
    },
    love: {
      layla: [
        `دەستی لەسەر ڕوومەتت دادەنێت: «سیپان... تۆ تەنها میوانێکی ئەم هۆتێلە نیت بۆ من، تۆ ئەو پیاوەیت کە هەموو شەوێک خەیاڵم داگیر دەکەیت.»`,
      ],
      celine: [
        `فرمێسکێکی شەوق لە چاوە بنەوشەییەکانیدا دەبریسکێتەوە: «هەرچەندە هەوڵمدا لەبیرت بکەم سیپان، نەمتوانی... دڵم هێشتا و هەمیشە تەنها ناوی تۆ دەهێنێت.»`,
      ],
      aria: [
        `بە گەرمی لە باوەشت دەگرێت: «من بە ئاسانی دڵ نادەم بە کەس سیپان، بەڵام تۆ بە یەک نیگا منی سەرشێتت بە تەواوی بردەوە!»`,
      ],
    },
    photo: {
      layla: [
        `مۆبایلەکەی دادەنێت و زەردەخەنەیەکی نازدار دەکات: «ئەم وێنە تایبەتەم تەنها بۆ تۆ گرت سیپان... بەڵام وێنە بەس نییە، دەمەوێت خۆت لێرە لەبەردەمم بیت.»`,
      ],
      celine: [
        `بە شەرمێکی شیرینەوە دەڵێت: «ئەوەش وێنەی ئەمشەوم بۆ تۆ سیپان... مەیدە بە کەس، ئەم ساتە تەنها نهێنیی نێوان خۆمانە.»`,
      ],
      aria: [
        `پێکەنینێکی شۆخ دەکات: «چۆنە وێنەکەم سیپان؟ لە ڕاستیدا لەمەش جوانترە ئەگەر ئێستا سەربکەویتە نهۆمی ١٨ بۆ لام!»`,
      ],
    },
    status: {
      layla: [
        `بە دەنگێکی نەرم و مەخمەلی وەڵامت دەداتەوە: «لێرەم سیپان گیان، لە ژوورە تایبەتەکەم چاوەڕێی هەنگاوەکانی تۆم... بڵێ ئەمشەو چیمان بۆ هەڵبژاردووە؟»`,
      ],
      celine: [
        `سەری بەرز دەکاتەوە و زەردەخەنەیەکی گەرم دەکات: «تەنها بیرم لە تۆ دەکردەوە سیپان... باش بوو دەنگتم بیستەوە، وەرە نزیکم دانیشە.»`,
      ],
      aria: [
        `لە لێواری مەلەوانگەکەوە دەستت بۆ بادەدات: «لە سەربانم سیپان! کەشەکەی ئەمشەو بێ تۆ تەواو نابێت، زوو وەرە بۆ لام!»`,
      ],
    },
    general: {
      layla: [
        `پەنجەکانی بە هێواشی بەسەر دەستتدا دەهێنێت و سەیری ناو چاوەکانت دەکات: «هەموو وشەیەکی دەمی تۆ سیپان وەک مۆسیقایەکی شەوانە دەچێتە ناو ڕۆحمەوە... ئەمشەو چیتر لە دڵتدایە پێم بڵێ؟»`,
        `سەری دەخاتە سەر شانت و هەناسە گەرمەکەی بەر گەردنت دەکەوێت: «تۆ زۆر باش دەزانیت چۆن لێدانی دڵم خێرا بکەیت سیپان... بمێنەرەوە لەلام، با ئەم شەوە باراناوییە کۆتایی نەیەت.»`,
      ],
      celine: [
        `دەستەکانت توند دەگوشێت و بە نیگایەکی پڕ لە سۆزەوە دەڵێت: «سیپان... کاتێک بەو شێوەیە قسەم لەگەڵ دەکەیت، هەست دەکەم تەنها ئێمە لەم جیهانەدا هەین. زیاترم پێ بڵێ...»`,
        `لێوی نزیک دەکاتەوە لە ڕوومەتت: «هیچ کەسێک وەک تۆ لە ناخم تێناگات سیپان... ئەمشەو هەموو یاسا و سنوورە ساردەکانم بۆ تۆ وەلا ناوە.»`,
      ],
      aria: [
        `بە ناز و شۆخییەوە قۆڵت دەگرێت: «ئۆهـ سیپان، قسەکردن لەگەڵ تۆ هەمیشە پڕە لە ئاگر و سوپرایز! پێم بڵێ ئەمشەو دەوێریت چی بکەین پێکەوە؟»`,
        `پەنجەکانی دەخاتە ناو قژتەوە و زەردەخەنە دەکات: «حەزم لەو متمانەبەخۆبوونەتە سیپان... هەرچییەکت بوێت ئەمشەو لە نهۆمی ١٨ قسەی تۆ دەڕوات!»`,
      ],
    },
  };

  const openerList = openers[heroineId];
  const bodyList = intentReplies[intent][heroineId];
  const modeTail =
    contextMode === 'phone' && intent !== 'room'
      ? locale === 'ckb'
        ? `\n\n📱 «لەسەر نەخشە ئازادەکەی هۆتێلەکەش دەتوانیت ئێستا ڕاستەوخۆ بە پێ بێیتە ژوورەکەم سیپان، چاوەڕێتم...»`
        : ''
      : '';

  return `${openerList[h % openerList.length]}\n\n${bodyList[(h >> 3) % bodyList.length]}${modeTail}`;
}
