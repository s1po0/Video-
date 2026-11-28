import { HeroineId, LocationId, SceneBeat, StoryChapter } from '../types/game';

const HEROINE_ATMOSPHERE: Record<
  HeroineId,
  {
    normal: string;
    blush: string;
    preIntro: SceneBeat[];
    postFollowUp: SceneBeat[];
  }
> = {
  layla: {
    normal: '/assets/layla_normal.jpg',
    blush: '/assets/layla_blush.jpg',
    preIntro: [
      {
        speaker: 'narrator',
        image: '/assets/bg_lounge.jpg',
        camera: 'pan_left',
        text: {
          ckb: 'تیشکی زەردی مۆمەکان بە نەرمی لەسەر دیواری مەخمەلی و شووشە باراناوییەکان دەلەرزنەوە. لە دوورەوە بۆنی گەرمی ڤانێلا و عەتری شەوانەی لەیلا تەواوی هەواکەی پڕ کردووە پێش ئەوەی تەنانەت دەنگیشی ببیستیت.',
          en: 'Warm amber candlelight flickers across velvet walls and rain-streaked glass. Even before she speaks, Layla’s intoxicating scent of warm vanilla and night jasmine wraps around you.',
        },
      },
      {
        speaker: 'you',
        image: '/assets/layla_normal.jpg',
        camera: 'normal',
        text: {
          ckb: 'بە هێمنی لێی نزیک دەبیتەوە و بە دەنگێکی نزم دەڵێیت: «هەموو جارێک کە دێمە ئێرە، وا هەست دەکەم تەنها چاوەڕێی هاتنی من بوویت، لەیلا.»',
          en: 'Stepping into her warm shadow, you murmur: “Every time I walk into this room, Layla, it feels like you were waiting just for me.”',
        },
      },
      {
        speaker: 'layla',
        image: '/assets/layla_normal.jpg',
        camera: 'close',
        text: {
          ckb: 'لەیلا بە هێواشی ئاوڕ دەداتەوە، چاوە هەنگوینییەکانی لە سەرەوە بۆ خوارەوە سەیرت دەکەن و زەردەخەنەیەکی پڕ لە ناز و ئاگر دەکەوێتە سەر لێوەکانی: «ڕەنگە لەبەر ئەوە بێت کە تۆ تاکە پیاویت لێرە بتوانێت بە یەک نیگا هەموو ئارامیی من بشێوێنێت... وەرە پێشتر، مەهێڵە هیچ مەودایەک لە نێوانماندا بمێنێتەوە.»',
          en: 'Layla turns slowly, amber eyes sweeping over you before curving into a sultry smile: “Maybe because you’re the only man in this hotel who ruins my composure with a single glance… come closer, don’t leave an inch between us.”',
        },
      },
    ],
    postFollowUp: [
      {
        speaker: 'you',
        image: '/assets/layla_blush.jpg',
        camera: 'close',
        text: {
          ckb: 'پەنجەکانت بە نەرمی دەخشێنیت بە سەر مەچەک و پەنجە گەرمەکانیدا: «کاتێک ئاوا سەیرم دەکەیت، زۆر قورسە بتوانم خۆم ڕابگرم و سنوور نەبەزێنم.»',
          en: 'Tracing slow warmth along her wrist, you whisper: “When you look up at me like that, keeping my hands to myself becomes nearly impossible.”',
        },
      },
      {
        speaker: 'layla',
        image: '/assets/layla_blush.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        text: {
          ckb: 'لەیلا هەناسەیەکی قووڵ و لەرزۆک هەڵدەمژێت و خۆی زیاتر بە سینگتەوە دەنووسێنێت تا گوێت لە لێدانی خێرای دڵی دەبێت: «کێ وتی دەمەوێت خۆت ڕابگریت؟... لەگەڵ تۆدا نامەوێت هیچ سنوورێک هەبێت. ئەمشەو تا کۆتایی لە لای من بمێنەرەوە.»',
          en: 'Her breath hitches softly as she leans flush against your chest, letting you feel her racing heartbeat: “Who asked you to hold back? With you, I don’t want a single wall left standing tonight…”',
        },
      },
    ],
  },
  celine: {
    normal: '/assets/celine_normal.jpg',
    blush: '/assets/celine_blush.jpg',
    preIntro: [
      {
        speaker: 'narrator',
        image: '/assets/bg_lounge.jpg',
        camera: 'pan_right',
        text: {
          ckb: 'دەنگی بارانەکەی دەرەوە توندتر دەبێت و سێبەری بڵێسەی ئاگرەکە بەسەر ڕوخساری سێلیندا سەما دەکات. هەر کە چاوی بە تۆ دەکەوێت، دەستەکانی بە سووکی دەلەرزن و هەوڵ دەدات هەناسە خێراکەی بشارێتەوە.',
          en: 'Rain drums harder against the tall penthouse windows as firelight dances across Celine’s silver-blonde hair. The instant her violet eyes meet yours, her breath catches.',
        },
      },
      {
        speaker: 'you',
        image: '/assets/celine_normal.jpg',
        camera: 'normal',
        text: {
          ckb: 'هەنگاوێک بەرەو ڕووی دەنێیت: «سێلین... تا کەی وا خۆت نیشان دەدەیت کە ئەو شەوانەی پاریست بیر چووەتەوە؟ چاوەکانت شتێکی تەواو پێچەوانە دەڵێن.»',
          en: 'Closing the distance between you, you say softly: “How much longer are we going to pretend Paris didn’t burn into both of us, Celine?”',
        },
      },
      {
        speaker: 'celine',
        image: '/assets/celine_blush.jpg',
        camera: 'close',
        text: {
          ckb: 'گۆناکانی سێلین سوور هەڵدەگەڕێن و نیگاکەی بۆ چرکەیەک دادەبەزێتە سەر لێوت پێش ئەوەی بە چرپەیەکی لەرزیو وەڵام بداتەوە: «بێڕەحم... تۆ باش دەزانیت تەنانەت بۆ یەک چرکەش تۆم لەبیر نەکردووە. هەر کاتێک ئاوا لێم نزیک دەبیتەوە، هەموو هێزی خۆم لەدەست دەدەم.»',
          en: 'A fierce blush rises across her cheeks, her gaze dropping momentarily to your lips: “Cruel… you know perfectly well I haven’t forgotten a single touch. Every time you step this close, my willpower shatters.”',
        },
      },
    ],
    postFollowUp: [
      {
        speaker: 'you',
        image: '/assets/celine_blush.jpg',
        camera: 'close',
        text: {
          ckb: 'دەستت بە نەرمی دەخەیتە سەر ڕوومەتە گەرمەکەی: «ئەمجارە ڕێگە نادەم هیچ شتێک لێکمان داببڕێت، سێلین. تۆ هی منیت.»',
          en: 'Cupping her warm cheek, you murmur: “No running away this time, Celine. Tonight, it’s just the two of us.”',
        },
      },
      {
        speaker: 'celine',
        image: '/assets/celine_blush.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        text: {
          ckb: 'سێلین چاوەکانی دادەخات و لێوی بە نەرمی دەنووسێنێت بە ناو لەپی دەستتەوە، پاشان توند یەخەی چاکەتەکەت دەگرێت: «کەواتە ئەمشەو توند لە باوەشم بگرە و قەرەبووی هەموو ئەو دوو ساڵە ساردەم بۆ بکەرەوە...»',
          en: 'Celine closes her eyes, pressing a warm kiss into your palm before clutching your lapels tight: “Then hold me close tonight and make up for every lonely night since Paris…”',
        },
      },
    ],
  },
  aria: {
    normal: '/assets/aria_normal.jpg',
    blush: '/assets/aria_blush.jpg',
    preIntro: [
      {
        speaker: 'narrator',
        image: '/assets/bg_pool.jpg',
        camera: 'pan_left',
        text: {
          ckb: 'هەڵمی گەرمی ئاوەکە لەگەڵ ڕووناکیی زێڕینی نهۆمی ١٨دا کەشێکی خەیاڵی و ورووژێنەری دروست کردووە. ئاریا بە عەزییە ئاوریشمییەکەیەوە پشتی بە پەرژینی شووشەییەکەوە داوە و بە پەنجەیەک بانگت دەکات.',
          en: 'Warm mist curls off the glowing 18th-floor water under golden fairy lights. Aria leans against the glass balustrade in shimmering silk and crooks a playful finger toward you.',
        },
      },
      {
        speaker: 'you',
        image: '/assets/aria_normal.jpg',
        camera: 'normal',
        text: {
          ckb: 'بە زەردەخەنەیەکەوە دەچیتە تەنیشتی: «وا دیارە جوانترین دیمەنی ئەم شارە لە دەرەوەی پەنجەرەکە نییە، بەڵکو لێرە لە تەنیشت من وەستاوە.»',
          en: 'Stepping right beside her, you smile: “Looks like the best view on the 18th floor isn’t the skyline—it’s standing right in front of me.”',
        },
      },
      {
        speaker: 'aria',
        image: '/assets/aria_blush.jpg',
        camera: 'close',
        text: {
          ckb: 'ئاریا بە نازەوە پێدەکەنێت و شانە ڕووت و گەرمەکەی دەخشێنێت بە قۆڵتدا: «ئۆهـ! بەو قسە شیرینانەت دەتەوێت هەر لە ئێستاوە سەرخۆشم بکەیت؟ وەرە نزیکتر، حەز دەکەم یارییەکەمان زۆر گەرمتر بکەین ئەمشەو...»',
          en: 'Aria laughs softly, brushing her warm bare shoulder against your arm: “Oh! Trying to make me dizzy before I’ve even poured your drink? Step closer—let’s turn the heat way up tonight…”',
        },
      },
    ],
    postFollowUp: [
      {
        speaker: 'you',
        image: '/assets/aria_blush.jpg',
        camera: 'close',
        text: {
          ckb: 'کەمەری بە نەرمی دەگریت و لە خۆتی نزیکتر دەکەیتەوە: «لەگەڵ تۆدا تێنابم لە قسەکردن و نزیکبوونەوە، ئاریا.»',
          en: 'Resting a warm hand at her waist, you murmur: “Being close to you is dangerously addictive, Aria.”',
        },
      },
      {
        speaker: 'aria',
        image: '/assets/aria_blush.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        text: {
          ckb: 'هەناسە گەرمەکەی ئاریا بەر لێو و چەناگەت دەکەوێت لە کاتێکدا قۆڵەکانی لە دەوری ملت توند دەکات: «منیش ئاڵوودەی دەست و نیگای تۆ بووم... پەیمانت پێ دەدەم ئەمشەو بە ئاسانی دەستت لێ هەڵناگرم!»',
          en: 'Her warm breath ghosts across your lips as she loops both arms tight around your neck: “Good—because I’m completely hooked on you too, and I’m not letting you go easily tonight!”',
        },
      },
    ],
  },
};

export function enrichStoryChapters(chapters: StoryChapter[]): StoryChapter[] {
  return chapters.map((ch) => {
    const extra = HEROINE_ATMOSPHERE[ch.heroine];
    return {
      ...ch,
      introBeats: [...extra.preIntro, ...ch.introBeats],
      choices: ch.choices.map((choice) => ({
        ...choice,
        followUpBeats: [...choice.followUpBeats, ...extra.postFollowUp],
      })),
    };
  });
}

export function enrichDynamicScene(
  heroine: HeroineId,
  _location: LocationId,
  base: { beats: SceneBeat[]; choices: StoryChapter['choices'] }
) {
  const extra = HEROINE_ATMOSPHERE[heroine];
  return {
    beats: [...extra.preIntro, ...base.beats],
    choices: base.choices.map((choice) => ({
      ...choice,
      followUpBeats: [...choice.followUpBeats, ...extra.postFollowUp],
    })),
  };
}
