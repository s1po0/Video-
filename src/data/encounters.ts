import {
  EncounterChoice,
  FinaleEnding,
  HeroineId,
  LocationId,
  PhoneThread,
  SceneBeat,
  StoryChapter,
} from '../types/game';

export const ARRIVAL_PROLOGUE: SceneBeat[] = [
  {
    speaker: 'narrator',
    image: '/assets/bg_lounge.jpg',
    camera: 'pan_left',
    text: {
      ckb: 'بەخێربێیت بۆ سویتی شاهانەی نهۆمی ١٧ و ١٨ـی هۆتێلی «ڤێڵڤێت سکای». تۆ بۆ ماوەی حەوت شەوی باراناوی وەک هەڵسەنگێنەری تایبەتی خشڵە دەگمەنەکان بانگهێشت کراویت — بەڵام هەر لە یەکەم کاتژمێردا، ملوانکەی ئەفسانەیی «دڵی یاقووت» لە ژووری شووشەییەکە دیار نامێنێت!',
      en: 'Welcome to the 17th & 18th floor VIP sanctuary of the Velvet Sky Hotel. Hired for a seven-night winter gala to appraise The Crimson Heart ruby, your stay turns electric on hour one when the priceless gem vanishes from its case!',
    },
  },
  {
    speaker: 'layla',
    image: '/assets/layla_normal.jpg',
    camera: 'close',
    effect: 'heartbeat',
    unlockCg: 'layla_normal',
    text: {
      ckb: 'لە لای پیانۆ مۆمدارەکە، «لەیلا» بە عەزیی مەخمەلیی سەوز و بۆنی گەرمی ڤانێلاوە پەنجەی دەخشێنێت بە مەچەکتدا: «حەوت شەومان لەپێشە لەم هۆتێلەدا... پێم بڵێ، تەنها بۆ پشکنینی بەردی سارد هاتوویت، یان دەوێریت نزیکی ئاگر بکەویتەوە؟»',
      en: 'Beside the candlelit grand piano, Layla brushes warm fingertips along your wrist in her emerald velvet gown: “Seven rainy nights locked in luxury… tell me, did you only come to inspect cold jewels, or do you dare play with fire?”',
    },
  },
  {
    speaker: 'celine',
    image: '/assets/celine_normal.jpg',
    camera: 'normal',
    unlockCg: 'celine_normal',
    text: {
      ckb: 'لە پشتی شووشە باراناوییەکانەوە، «سێلین» دەردەکەوێت — خۆشەویستە کۆنەکەی دوو ساڵ لەمەوبەری پاریس کە ئێستا لێکۆڵەری تایبەتی دۆسیەکەیە! نیگاکەی لە نێوان ساردیی فەرمی و تامەزرۆییەکی شاردراوەدا دەلەرزێت: «تۆ لێرە چیی دەکەیت؟... تا حەوت شەوی تر کەس بۆی نییە ئەم دوو نهۆمە جێبهێڵێت.»',
      en: 'By the rain-streaked glass stands Celine—your unforgettable flame from Paris two years ago, now lead investigator on the theft. Her violet eyes flicker between cool duty and raw longing: “You…? Nobody leaves the penthouse floors until my seven-day inquiry ends.”',
    },
  },
  {
    speaker: 'aria',
    image: '/assets/aria_normal.jpg',
    camera: 'close',
    effect: 'warm_glow',
    unlockCg: 'aria_normal',
    text: {
      ckb: 'و لە قادرمەی مەلەوانگە گەرمەکەی نهۆمی ١٨ـەوە، «ئاریا» بە عەزیی ڕەش و زێڕینەوە جامێکی کریستاڵت بۆ بەرز دەکاتەوە: «هەر کاتێک لە گرژیی خوارەوە ماندوو بوویت، وەرە سەرەوە بۆ کەپرە تایبەتەکەی من... کلیدی سویتی ١٧٠٩ـم بۆ ئامادە کردوویت.»',
      en: 'From the 18th-floor infinity pool stairs, Aria raises a crystal glass in shimmering black-and-gold silk: “Whenever the tension downstairs gets too hot—or not hot enough—come up to my misty poolside cabana. Suite 1709 is all yours.”',
    },
  },
];

export const HEROINE_CHAPTERS: StoryChapter[] = [
  // ==================== LAYLA CHAPTERS (1..5) ====================
  {
    id: 'layla_ch1',
    heroine: 'layla',
    chapterNum: 1,
    requiredAffection: 0,
    location: 'lounge',
    title: { ckb: 'چرپەی سەر پیانۆکە', en: 'Whispers Over Ivory Keys' },
    introBeats: [
      {
        speaker: 'narrator',
        image: '/assets/layla_normal.jpg',
        camera: 'normal',
        text: {
          ckb: 'هۆڵی جازەکە چۆڵ بووە و تەنها دەنگی باران و ڕووناکیی مۆمەکان ماونەتەوە. لەیلا لەسەر کورسیی پیانۆکە دانیشتووە؛ قۆڵە ڕووتەکانی بە سەرمادا کەمێک دەلەرزن بەڵام نیگاکەی وەک پشکۆ گەرمە.',
          en: 'The jazz lounge has emptied, leaving only rain against the glass and flickering amber candles. Layla sits alone at the grand piano, bare shoulders slightly chilled yet amber eyes burning bright.',
        },
      },
      {
        speaker: 'layla',
        image: '/assets/layla_blush.jpg',
        camera: 'close',
        effect: 'heartbeat',
        unlockCg: 'layla_blush',
        text: {
          ckb: '«لەو کاتەوەی هاتوویتەتە ئێرە، چاوەکانت شتێک دەڵێن کە زمانت نایڵێت... وەرە تەنیشتم دانیشە. دەمەوێت بزانم تا چەند دەتوانیت لە نزیکمەوە خۆت ڕابگریت.»',
          en: '“Since the moment you arrived, your eyes have been saying things your lips haven’t dared… Sit right beside me. Let’s see how steady your breathing stays this close.”',
        },
      },
    ],
    choices: [
      {
        id: 'l1_bold',
        style: 'bold',
        text: {
          ckb: '🔥 پاڵتۆکەت دابکەنە و بیخە سەر شانی، پاشان دەستت بخە سەر دەستی لەسەر پیانۆکە.',
          en: '🔥 Drape your warm coat over her shoulders and cover her fingers on the keys.',
        },
        affectionDelta: 18,
        desireDelta: 15,
        trustDelta: 10,
        charmGain: 2,
        triggerHeartbeat: true,
        memory: {
          ckb: 'شەوی یەکەم پاڵتۆ گەرمەکەت دای بە شانیدا لەسەر پیانۆکە.',
          en: 'You wrapped your warm jacket around her shoulders at the piano.',
        },
        followUpBeats: [
          {
            speaker: 'layla',
            image: '/assets/layla_blush.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            text: {
              ckb: 'لەیلا چاکەتەکەت لە خۆی دەئاڵێنێت و هەناسەیەکی قووڵ لە بۆنی یەخەکەت هەڵدەمژێت: «ئمم... ئێستا بۆنی تۆم گرتووە. ئەمشەو زۆر زوو خاڵی لاوازی منت دۆزییەوە.»',
              en: 'Layla pulls your coat tight, inhaling the scent on your collar with half-closed eyes: “Mmm… now I’m wrapped in your warmth. You found my weakness way too fast.”',
            },
          },
        ],
        passionBonusBeats: [
          {
            speaker: 'narrator',
            image: '/assets/layla_blush.jpg',
            camera: 'intimate_zoom',
            effect: 'heartbeat',
            text: {
              ckb: '🔥 [دیمەنی گەرمیی زیاتر] پێش ئەوەی هەستیتەوە، لەیلا پەنجەکانت توند دەگرێت و لێوی بە نەرمی دەخشێنێت بە پشتی دەستتدا، لە کاتێکدا چاو لە ناو چاوت دەبڕێت!',
              en: '🔥 [PASSION BONUS] Before you can rise, Layla catches your hand and presses a slow, lingering kiss against your knuckles while holding your gaze!',
            },
          },
        ],
      },
      {
        id: 'l1_playful',
        style: 'playful',
        text: {
          ckb: '😏 بە بزەیەکی شۆخەوە بڵێ: «ئەی ئەگەر من بم کە لێدانی دڵی تۆ تێکبدەم؟»',
          en: '😏 Tease her softly: “What if I’m the one who makes your pulse lose rhythm?”',
        },
        affectionDelta: 14,
        desireDelta: 12,
        trustDelta: 6,
        followUpBeats: [
          {
            speaker: 'layla',
            image: '/assets/layla_blush.jpg',
            camera: 'close',
            text: {
              ckb: 'پێکەنینێکی نەرم و دڵڕفێن لە قورگیەوە دێتە دەر: «بەڵێنێکی گەورەیە... با لە شەوانی داهاتوودا بیبینم چیت لەدەست دێت.»',
              en: 'A low, velvety laugh escapes her throat: “Big promise… prove it to me over the coming nights.”',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'layla_ch2',
    heroine: 'layla',
    chapterNum: 2,
    requiredAffection: 25,
    location: 'balcony',
    title: { ckb: 'یاریی لێدانی دڵ لەسەر باڵکۆن', en: 'Pulse Game in the Rain' },
    introBeats: [
      {
        speaker: 'narrator',
        image: '/assets/bg_balcony.jpg',
        camera: 'pan_right',
        text: {
          ckb: 'لەسەر باڵکۆنە داپۆشراوەکە شێی باران و ڕووناکیی فانۆسە زەردەکان تێکەڵ بوون. لەیلا پشتی بە پەرژینی مەڕمەڕەکەوە داوە و بە پەنجەیەک بانگت دەکاتە ناو سێبەری گەرمەکە.',
          en: 'Out on the covered terrace, rain mist drifts past glowing amber lanterns. Layla leans back against the marble railing and crooks a finger, inviting you right into her personal space.',
        },
      },
      {
        speaker: 'layla',
        image: '/assets/layla_blush.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        text: {
          ckb: '«دەمەوێت یارییەک بکەین... دوو پەنجەت بخە سەر مل و چەناگەم و بۆ دە چرکە چاوت لەسەر لێوم و چاوم لامەبە. بزانم کاممان زووتر تەسلیم دەبین.»',
          en: '“Let’s play a dangerous game… rest two fingers right below my jawline to feel my pulse, and don’t break eye contact for ten seconds. Let’s see who surrenders first.”',
        },
      },
    ],
    choices: [
      {
        id: 'l2_touch',
        style: 'bold',
        text: {
          ckb: '🔥 هەنگاو بنێ پێشەوە تا سینگت نزیکی دەبێتەوە و پەنجەت بخە سەر پێستی گەرمی ملی.',
          en: '🔥 Step flush into her space and rest your fingers warmly along her pulse.',
        },
        affectionDelta: 22,
        desireDelta: 20,
        trustDelta: 12,
        triggerHeartbeat: true,
        memory: {
          ckb: 'لە ژێر باراندا یاریی خوێندنەوەی لێدانی دڵت لەگەڵ لەیلا بردەوە.',
          en: 'You held Layla’s gaze and felt her racing pulse on the rainy terrace.',
        },
        followUpBeats: [
          {
            speaker: 'layla',
            image: '/assets/layla_blush.jpg',
            camera: 'intimate_zoom',
            effect: 'heartbeat',
            text: {
              ckb: 'لە ژێر پەنجەکانتدا لێدانی دڵی وەک باڵندەیەکی گیراو خێرا دەبێت! هەناسەی دەبڕێت و بە چرپە دەڵێت: «فێڵباز... تۆ دڵی منت شێواند بێ ئەوەی تەنانەت یەک وشەش بڵێیت.»',
              en: 'Under your fingertips, her pulse hammers wildly! Her breath catches against your chin: “Unfair… you made my heart lose control without saying a single word.”',
            },
          },
        ],
        passionBonusBeats: [
          {
            speaker: 'layla',
            image: '/assets/layla_blush.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            text: {
              ckb: '🔥 [گەرمیی ١٠٠٪] لەیلا دەستە گەرمەکەی دەخاتە پشتی ملت و ڕوومەتی دەنووسێنێت بە ڕوومەتتەوە: «ئەگەر کەس لێرە نەبووایە... هەر ئێستا نەمدەهێشت لێوم بەتاڵ بمێنێتەوە.»',
              en: '🔥 [FEVER BONUS] Layla slides a hand behind your nape, pressing her warm cheek to yours: “If the terrace doors weren’t glass… I wouldn’t stop at just your fingers tonight.”',
            },
          },
        ],
      },
      {
        id: 'l2_tender',
        style: 'tender',
        text: {
          ckb: '💖 بە نەرمی دڵۆپە بارانەکان لەسەر گۆنای بسڕە و بپرسە چی لە دڵیدا شاردووەتەوە.',
          en: '💖 Gently wipe the rain mist from her cheek and ask what weighs on her heart.',
        },
        affectionDelta: 20,
        desireDelta: 10,
        trustDelta: 20,
        followUpBeats: [
          {
            speaker: 'layla',
            image: '/assets/layla_blush.jpg',
            camera: 'close',
            text: {
              ckb: 'لەیلا چاوەکانی دادەخات و ڕوومەتی دەخاتە ناو لەپی دەستتەوە، پاشان نهێنیی ملوانکە دزراوەکەی دایکی کۆچکردوویت بۆ باس دەکات!',
              en: 'She leans into your warm palm with closed eyes and quietly confesses that The Crimson Heart belonged to her late mother.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'layla_ch3',
    heroine: 'layla',
    chapterNum: 3,
    requiredAffection: 60,
    location: 'lounge',
    title: { ckb: 'سەمای خاو لە تاریکیدا', en: 'Slow Dance After Midnight' },
    introBeats: [
      {
        speaker: 'narrator',
        image: '/assets/bg_lounge.jpg',
        camera: 'normal',
        text: {
          ckb: 'درەنگانی شەوە و قەوانێکی کۆنی جاز بە دەنگێکی نزم دەسوڕێتەوە. لەیلا دەڕوانێتە تۆ و هەردوو دەستی درێژ دەکات بۆ سەمایەکی دووقۆڵی لە نیوەشەودا.',
          en: 'Past midnight, a vinyl record spins a slow, aching melody in the dim lounge. Layla steps before you and extends her hand for a private midnight slow dance.',
        },
      },
    ],
    choices: [
      {
        id: 'l3_dance',
        style: 'bold',
        text: {
          ckb: '🔥 دەستت بخە سەر کەمەری مەخمەلیی عەزییەکەی و بە تەواوی لە خۆتی نزیک بکەرەوە.',
          en: '🔥 Slip your arm firmly around her emerald velvet waist and pull her flush against you.',
        },
        affectionDelta: 26,
        desireDelta: 24,
        trustDelta: 15,
        triggerHeartbeat: true,
        memory: {
          ckb: 'لە تاریکیی نیوەشەودا سەمایەکی گەرم و نزیکت لەگەڵ لەیلا کرد.',
          en: 'Shared a breathless midnight slow dance pressed close together.',
        },
        followUpBeats: [
          {
            speaker: 'layla',
            image: '/assets/layla_blush.jpg',
            camera: 'intimate_zoom',
            effect: 'heartbeat',
            text: {
              ckb: 'لەیلا سەری لەسەر شانت دادەنێت لە کاتێکدا بە هێواشی دەجوڵێنەوە؛ لێوی بە سووکی بەر لای گەردنت دەکەوێت: «تکایە با ئەم گۆرانییە هەرگیز تەواو نەبێت...»',
              en: 'Layla rests her head on your shoulder as you sway, her warm lips brushing your collarbone: “Tell me this record never ends…”',
            },
          },
        ],
        passionBonusBeats: [
          {
            speaker: 'layla',
            image: '/assets/cg_suite_date.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            unlockCg: 'cg_suite_date',
            text: {
              ckb: '🔥 [کرانەوەی سویتی ١٧٠٩] لە بن گوێتدا دەچرپێنێت: «کاتێک دەچیتەوە سویتی ١٧٠٩... ئەمشەو دەرگاکەت قفڵ مەکە. دێم بۆ لات.»',
              en: '🔥 [SUITE UNLOCKED] She whispers against your ear: “When you go back to Suite 1709… leave the latch open for me.”',
            },
          },
        ],
      },
      {
        id: 'l3_spin',
        style: 'playful',
        text: {
          ckb: '😏 بە لێزانی بیسووڕێنەوە و لە ناو باوەشتدا بیگرەوە لەگەڵ زەردەخەنەیەک.',
          en: '😏 Spin her gracefully and catch her low in your arms with a confident grin.',
        },
        affectionDelta: 20,
        desireDelta: 16,
        trustDelta: 12,
        followUpBeats: [
          {
            speaker: 'layla',
            image: '/assets/layla_blush.jpg',
            camera: 'close',
            text: {
              ckb: 'هەناسەی بڕاوە و هەردوو دەستی لە دەوری ملت توند دەکات: «ئۆهـ! نەمزانی ئەوەندەش لە سەمادا مەترسیداریت!»',
              en: 'Breathless, she loops both arms tight around your neck: “Oh! Nobody warned me you moved like that!”',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'layla_ch4',
    heroine: 'layla',
    chapterNum: 4,
    requiredAffection: 105,
    location: 'suite',
    title: { ckb: 'لێدانی دەرگای سویتی ١٧٠٩ لە نیوەشەودا', en: 'Midnight Knock at Suite 1709' },
    introBeats: [
      {
        speaker: 'narrator',
        image: '/assets/bg_penthouse.jpg',
        camera: 'normal',
        text: {
          ckb: 'کاتژمێر ١:٣٠ـی شەوە لە ناو سویتی تایبەتی ١٧٠٩. سێ تەقەی هێواش لە دەرگاکەت دەدرێت. کە دەیکەیتەوە، لەیلا بە تەنها لەبەر ڕووناکیی زەردی ڕێڕەوەکە وەستاوە و چاوەکانی پڕن لە تامەزرۆیی.',
          en: '1:30 AM inside VIP Suite 1709. Three soft knocks sound at your door. Opening it reveals Layla standing barefoot on the plush carpet, eyes luminous with unmistakable desire.',
        },
      },
      {
        speaker: 'layla',
        image: '/assets/cg_suite_date.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        unlockCg: 'cg_suite_date',
        text: {
          ckb: 'لەسەر قەنەفە مەخمەلییەکەی بەردەم پەنجەرە گەورەکە لە تەنیشتت دادەنیشێت و دەستت دەخاتە سەر گۆنا گەرمەکەی: «هەوڵمدا لە ژوورەکەی خۆم بخەوم... بەڵام تەنها بیرم لای تۆ بوو. ئەمشەو لێرە لای خۆتم دەهێڵیتەوە؟»',
          en: 'On the velvet sofa overlooking the rain-washed skyline, she guides your palm to her flushed cheek: “I tried staying in my own room… all I could think about was your touch. Keep me here tonight?”',
        },
      },
    ],
    choices: [
      {
        id: 'l4_stay',
        style: 'bold',
        text: {
          ckb: '🔥 ڕایبکێشە ناو باوەشت لەسەر قەنەفەکە و ماچێکی گەرم لەسەر مل و گۆنای دابنێ.',
          en: '🔥 Pull her across your lap into a warm embrace and press a slow kiss along her jaw.',
        },
        affectionDelta: 32,
        desireDelta: 30,
        trustDelta: 22,
        triggerHeartbeat: true,
        memory: {
          ckb: 'لەیلا لە نیوەشەودا هاتە سویتی ١٧٠٩ و تا بەیانی لە باوەشتدا مایەوە.',
          en: 'Layla visited Suite 1709 past midnight and stayed in your arms till dawn.',
        },
        followUpBeats: [
          {
            speaker: 'layla',
            image: '/assets/cg_suite_date.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            text: {
              ckb: 'هەناسە گەرمەکەی لەگەڵ هەناسەت تێکەڵ دەبێت و پەنجەکانی لە ناو قژتدا دەئاڵێنێت: «تەواو... چیتر دڵم هی خۆم نەما، هەمووی بوو بە هی تۆ.»',
              en: 'Her breath melts against yours as her fingers tangle softly in your hair: “It’s over for me… I’m completely yours now.”',
            },
          },
        ],
      },
      {
        id: 'l4_sweet',
        style: 'tender',
        text: {
          ckb: '💖 بەتانییە ئاوریشمییەکە بدە بە سەر هەردووکتاندا و تا بەرەبەیان لە باوەشی بگرە.',
          en: '💖 Wrap the silk throw around you both and hold her close listening to the storm.',
        },
        affectionDelta: 28,
        desireDelta: 18,
        trustDelta: 28,
        followUpBeats: [
          {
            speaker: 'layla',
            image: '/assets/cg_suite_date.jpg',
            camera: 'close',
            text: {
              ckb: 'لەیلا بە ئارامییەکی قووڵەوە سەری دەخاتە سەر سینگت: «یەکەم جارە لە ژیانمدا ئاوا هەست بە سەلامەتی و گەرمی بکەم.»',
              en: 'She nestles against your chest with a soft sigh: “First time in my life I’ve felt both safe and breathless at once.”',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'layla_ch5',
    heroine: 'layla',
    chapterNum: 5,
    requiredAffection: 155,
    location: 'balcony',
    title: { ckb: 'ئاگری ژێر باران — دانپێدانانی عەشق', en: 'Flame Beneath the Rain — Lover’s Vow' },
    introBeats: [
      {
        speaker: 'layla',
        image: '/assets/cg_layla_ending.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        unlockCg: 'cg_layla_ending',
        text: {
          ckb: 'لەژێر باران و تیشکی فانۆسەکانی نهۆمی ١٧، چاکەتەکەی تۆ لەسەر شانی لەیلایە و بە هەردوو دەستی ڕوومەتت دەگرێت: «گرنگ نییە سبەی چیی ڕوودەدات... من شێت و شەیدای تۆ بووم. هەر ئێستا ماچم بکە.»',
          en: 'Under falling rain and warm balcony lanterns, wrapped in your coat, Layla cradles your face with trembling hands: “I don’t care about anything outside this terrace… I’m wildly in love with you. Kiss me right now.”',
        },
      },
    ],
    choices: [
      {
        id: 'l5_kiss',
        style: 'bold',
        text: {
          ckb: '❤️‍🔥 بێ هیچ وشەیەک، ماچێکی قووڵ و پڕ لە ئاگری لەژێر بارانەکەدا بکە!',
          en: '❤️‍🔥 Close the last breath between you in a deep, passionate rain-soaked kiss!',
        },
        affectionDelta: 35,
        desireDelta: 35,
        trustDelta: 25,
        triggerHeartbeat: true,
        memory: {
          ckb: 'پەیمانی عەشق و ماچی ژێر بارانت لەگەڵ لەیلا بەست (ئاستی ٥: خۆشەویستی ئاگرین).',
          en: 'Sealed your passionate balcony kiss with Layla (Rank 5 Lover!).',
        },
        followUpBeats: [
          {
            speaker: 'narrator',
            image: '/assets/cg_layla_ending.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            text: {
              ckb: 'لەژێر نمەی باراندا کات دەوەستێت؛ لەیلا بە تامەزرۆییەوە خۆی پێتەوە دەنووسێنێت و پەیوەندیتان دەگاتە بەرزترین لوتکە (خۆشەویستی ئاگرین)!',
              en: 'Time stands still beneath the warm lanterns as Layla melts completely into your kiss—unlocking her Rank 5 Lover bond!',
            },
          },
        ],
      },
    ],
  },

  // ==================== CELINE CHAPTERS (1..5) ====================
  {
    id: 'celine_ch1',
    heroine: 'celine',
    chapterNum: 1,
    requiredAffection: 0,
    location: 'fireplace',
    title: { ckb: 'پشکنینی تایبەت لەبەردەم ئاگردا', en: 'Close Inspection by the Hearth' },
    introBeats: [
      {
        speaker: 'celine',
        image: '/assets/celine_normal.jpg',
        camera: 'close',
        text: {
          ckb: 'لە ژووری کتێبخانە و ئاگردانەکەدا، سێلین دەرگاکە دادەخات: «وەک لێکۆڵەر، دەبێت دڵنیا ببمەوە هیچ شتێکت لە گیرفانی پاڵتۆکەتدا نەشاردووەتەوە.» هەنگاو دەنێتە پێشەوە تا بۆنی قاوە و باران لە نێوانتاندا تێکەڵ دەبێت.',
          en: 'Inside the firelit archive room, Celine clicks the door shut: “Protocol says I inspect every guest personally.” She steps close enough that her cool lavender scent mingles with the hearth’s warmth.',
        },
      },
    ],
    choices: [
      {
        id: 'c1_hold',
        style: 'tender',
        text: {
          ckb: '💖 دەستی بگرە لەسەر سینگت: «سێلین... دوو ساڵ چاوەڕێی ئەم ساتە بووم، چیتر ڕامەکە.»',
          en: '💖 Cover her hand over your heart: “Two years since Paris, Celine… stop pretending you don’t feel this.”',
        },
        affectionDelta: 18,
        desireDelta: 14,
        trustDelta: 16,
        triggerHeartbeat: true,
        memory: {
          ckb: 'لە کاتی پشکنیندا دەستی سێلینت خستە سەر دڵی خۆت و دیوارە ساردەکەیت شکاند.',
          en: 'Held Celine’s hand over your racing heart by the fireplace.',
        },
        followUpBeats: [
          {
            speaker: 'celine',
            image: '/assets/celine_blush.jpg',
            camera: 'intimate_zoom',
            effect: 'heartbeat',
            unlockCg: 'celine_blush',
            text: {
              ckb: 'پەنجەکانی سێلین دەلەرزن و ڕوومەتەکانی وەک پشکۆ سوور دەبنەوە: «بێدەنگ بە... ئەگەر ئاوا سەیرم بکەیت، بیرم دەچێتەوە بۆچی لێرەم.»',
              en: 'Celine’s fingers tremble against your chest, a vivid blush blooming: “Quiet… look at me like that and I’ll forget my entire investigation.”',
            },
          },
        ],
      },
      {
        id: 'c1_tease',
        style: 'bold',
        text: {
          ckb: '🔥 سەرت نزم بکەرەوە لای گوێی: «ئەگەر تۆ لێکۆڵەرەکەیت، ئامادەم هەموو شەوێک دەستگیر بکرێم.»',
          en: '🔥 Murmur near her ear: “If you’re the detective, feel free to search me every single night.”',
        },
        affectionDelta: 15,
        desireDelta: 18,
        trustDelta: 8,
        followUpBeats: [
          {
            speaker: 'celine',
            image: '/assets/celine_blush.jpg',
            camera: 'close',
            unlockCg: 'celine_blush',
            text: {
              ckb: 'بە شەرمێکی توندەوە پاڵێکی سووک دەنێت بە شانتەوە: «هێشتا هەر وەک جاران بێشەرمیت!»',
              en: 'Flustered crimson, she presses a palm lightly to your chest: “Still as shameless as you were in Paris!”',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'celine_ch2',
    heroine: 'celine',
    chapterNum: 2,
    requiredAffection: 25,
    location: 'lounge',
    title: { ckb: 'ئاگرێکی شاراوەی غیرە', en: 'Sparks of Jealousy' },
    introBeats: [
      {
        speaker: 'celine',
        image: '/assets/celine_blush.jpg',
        camera: 'close',
        effect: 'heartbeat',
        text: {
          ckb: 'کاتێک سێلین دەتبینێت لە گۆشەیەکی تاریکی ڕێڕەوەکەدا، قۆڵی چاکەتەکەت دەگرێت و دەتکێشێتە تەنیشت دیوارەکە: «پێم بڵێ... زۆر چێژ دەبینیت لەوەی هەموو کچانی ئەم هۆتێلە بە دەورتدا دەسوڕێنەوە؟»',
          en: 'Catching you in the dim velvet corridor, Celine tugs your sleeve into an alcove, eyes flashing: “Tell me—are you enjoying watching every woman on this floor circle around you?”',
        },
      },
    ],
    choices: [
      {
        id: 'c2_reassure',
        style: 'bold',
        text: {
          ckb: '🔥 دەستێکت لەسەر دیوارەکەی پشتی دابنێ: «تەنها دەمویست ببینم کەی غیرەکەت دەردەبڕیت، سێلین.»',
          en: '🔥 Brace one hand gently on the wall beside her cheek: “I just wanted to see how long it’d take you to admit you’re jealous.”',
        },
        affectionDelta: 24,
        desireDelta: 22,
        trustDelta: 14,
        triggerHeartbeat: true,
        memory: {
          ckb: 'سێلین لە ڕێڕەوەکەدا غیرەی لێ کردیت و نەیتوانی بیشارێتەوە.',
          en: 'Cornered a deliciously jealous Celine in the candlelit corridor.',
        },
        followUpBeats: [
          {
            speaker: 'celine',
            image: '/assets/celine_blush.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            text: {
              ckb: 'هەناسەی سێلین خێرا دەبێت و چاوەکانی لە سەر لێوت جێگیر دەبن: «بەڵێ غیرە دەکەم... چونکە تۆ پێش هەموویان هی من بوویت.»',
              en: 'Her breath hitches, violet eyes dropping briefly to your lips: “Fine—I’m jealous! Because you were mine long before tonight.”',
            },
          },
        ],
      },
      {
        id: 'c2_gentle',
        style: 'tender',
        text: {
          ckb: '💖 پەنجەکانت تێکەڵی پەنجەکانی بکە: «چاوم تەنها بەدوای تۆدا دەگەڕا.»',
          en: '💖 Interlace your fingers warmly with hers: “You’re the only one I’ve been looking for.”',
        },
        affectionDelta: 22,
        desireDelta: 12,
        trustDelta: 22,
        followUpBeats: [
          {
            speaker: 'celine',
            image: '/assets/celine_blush.jpg',
            camera: 'close',
            text: {
              ckb: 'گرژیی سەر شانی خاو دەبێتەوە و دەستت توندتر دەگرێت.',
              en: 'All the tension melts from her shoulders as she squeezes your fingers tight.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'celine_ch3',
    heroine: 'celine',
    chapterNum: 3,
    requiredAffection: 60,
    location: 'fireplace',
    title: { ckb: 'نهێنیی شەوە باراناوییەکەی پاریس', en: 'The Truth About Paris' },
    introBeats: [
      {
        speaker: 'celine',
        image: '/assets/celine_blush.jpg',
        camera: 'intimate_zoom',
        text: {
          ckb: 'لەبەردەم ئاگردانەکەدا دەنگی سێلین دەلەرزێت: «ئەو شەوەی لە پاریس بەجێم هێشتیت، گرووپێکی مافیایی شوێنپێی منیان هەڵگرتبوو. ئەگەر بمایایەتەوە ژیانی تۆش دەکەوتە مەترسییەوە... دوو ساڵ هەموو شەوێک بە دەم گریانەوە ناوی تۆم دەهێنا.»',
          en: 'Before the crackling fire, Celine’s voice finally breaks: “That morning in Paris, a syndicate burned my cover. Leaving without waking you was the only way to keep them away from you… I missed you every single night for two years.”',
        },
      },
    ],
    choices: [
      {
        id: 'c3_embrace',
        style: 'tender',
        text: {
          ckb: '💖 توند لە باوەشی بگرە و سەری لەسەر سینگت دابنێ: «ئێستا لێرەین، چیتر ڕێگە نادەم بە تەنها بیت.»',
          en: '💖 Pull her tightly against your chest: “Never protect me by disappearing again—we face everything together.”',
        },
        affectionDelta: 28,
        desireDelta: 20,
        trustDelta: 28,
        triggerHeartbeat: true,
        memory: {
          ckb: 'برینی دوو ساڵەی پاریست لەگەڵ سێلین لەبەردەم ئاگردانەکە ساڕێژ کرد.',
          en: 'Healed the two-year scar of Paris in a tearful fireside embrace.',
        },
        followUpBeats: [
          {
            speaker: 'celine',
            image: '/assets/cg_celine_ending.jpg',
            camera: 'close',
            effect: 'warm_glow',
            text: {
              ckb: 'سێلین توند قۆڵەکانی لە کەمەرت دەئاڵێنێت و گەرمیی باوەشەکەتان هەموو ساردایی ڕابردوو دەتوێنێتەوە.',
              en: 'Celine wraps her arms fiercely around you, two years of loneliness dissolving into breathless warmth.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'celine_ch4',
    heroine: 'celine',
    chapterNum: 4,
    requiredAffection: 105,
    location: 'suite',
    title: { ckb: 'شەوی بێدەمامک لە سویتی ١٧٠٩', en: 'Unmasked in Suite 1709' },
    introBeats: [
      {
        speaker: 'celine',
        image: '/assets/celine_blush.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        text: {
          ckb: 'نیوەشەوە لە سویتی ١٧٠٩. سێلین دۆسیە فەرمییەکەی لەسەر مێزەکە فڕێ دەدات، قژە زیوینەکەی دەکاتەوە تا دەکەوێتە سەر شانی و هەنگاو دەنێت بەرەو تۆ: «ئەمشەو لێکۆڵەر نیم... تەنها ئافرەتێکم کە دوو ساڵە تینووی دەستەکانتە.»',
          en: 'Midnight in Suite 1709. Celine sets down her case files, lets her silver-blonde hair cascade loose over her shoulders, and steps into your arms: “No badges tonight… just a woman who has ached for your touch for two years.”',
        },
      },
    ],
    choices: [
      {
        id: 'c4_passion',
        style: 'bold',
        text: {
          ckb: '🔥 هەڵیبگرە بۆ لای پەنجەرە باراناوییەکە و تامەزرۆیی دوو ساڵ بە ماچێکی گەرم بشکێنە.',
          en: '🔥 Sweep her close beside the rain-streaked glass and claim the kiss you both waited two years for.',
        },
        affectionDelta: 32,
        desireDelta: 32,
        trustDelta: 24,
        triggerHeartbeat: true,
        memory: {
          ckb: 'شەوێکی لەبیرنەکراوی پڕ لە سۆز لەگەڵ سێلین لە سویتی ١٧٠٩.',
          en: 'An unforgettable night of rekindled passion with Celine in Suite 1709.',
        },
        followUpBeats: [
          {
            speaker: 'celine',
            image: '/assets/cg_celine_ending.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            unlockCg: 'cg_celine_ending',
            text: {
              ckb: 'سێلین یەخەت توند دەگرێت و بە هەناسەبڕکێوە دەچرپێنێت: «بەڵێنم پێ بدە تا بەیانی لە باوەشتدا بەرم نادەیت...»',
              en: 'Clutching your collar breathlessly, she whispers against your lips: “Promise you won’t let me go until sunrise…”',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'celine_ch5',
    heroine: 'celine',
    chapterNum: 5,
    requiredAffection: 155,
    location: 'fireplace',
    title: { ckb: 'پەیمانی هەمیشەیی سێلین', en: 'Two Years of Longing Fulfilled' },
    introBeats: [
      {
        speaker: 'celine',
        image: '/assets/cg_celine_ending.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        unlockCg: 'cg_celine_ending',
        text: {
          ckb: 'لەبەردەم تیشکی زێڕینی ئاگردانەکەدا، سێلین بە چاوێکی پڕ لە فرمێسکی خۆشی و ڕوومەتێکی گەشەوە پێتەوە نووساوە: «خۆشم دەوێیت... زیاتر لە پاریس، زیاتر لە هەموو ژیانم.»',
          en: 'Bathed in golden firelight, Celine looks up with tear-bright eyes and a radiant blush: “I love you—fiercer than in Paris, deeper than anything in my life.”',
        },
      },
    ],
    choices: [
      {
        id: 'c5_vow',
        style: 'bold',
        text: {
          ckb: '❤️‍🔥 بە ماچێکی قووڵ و هەمیشەیی کۆتایی بە هەموو دابڕانێک بهێنە!',
          en: '❤️‍🔥 Seal your forever promise in a breathless fireside kiss!',
        },
        affectionDelta: 35,
        desireDelta: 35,
        trustDelta: 30,
        triggerHeartbeat: true,
        memory: {
          ckb: 'سێلین بوو بە خۆشەویستی هەمیشەییت (ئاستی ٥: خۆشەویستی ئاگرین).',
          en: 'Reached Rank 5 Passionate Lover with Celine!',
        },
        followUpBeats: [
          {
            speaker: 'narrator',
            image: '/assets/cg_celine_ending.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            text: {
              ckb: 'پەیوەندیت لەگەڵ سێلین گەیشتە لوتکەی عەشق (ئاستی ٥: خۆشەویستی ئاگرین)!',
              en: 'Your bond with Celine has reached Rank 5: Passionate Lover!',
            },
          },
        ],
      },
    ],
  },

  // ==================== ARIA CHAPTERS (1..5) ====================
  {
    id: 'aria_ch1',
    heroine: 'aria',
    chapterNum: 1,
    requiredAffection: 0,
    location: 'pool',
    title: { ckb: 'هەڵمی گەرمی مەلەوانگەی نهۆمی ١٨', en: 'Midnight Steam on the 18th Floor' },
    introBeats: [
      {
        speaker: 'aria',
        image: '/assets/aria_normal.jpg',
        camera: 'close',
        unlockCg: 'aria_normal',
        text: {
          ckb: 'لە قەراغی مەلەوانگە گەرمەکەی سەربان، هەڵمێکی نەرم بەرز دەبێتەوە و ڕووناکیی شارەکە دەبریسکێتەوە. ئاریا جامێکی تایبەت دەخاتە ناو دەستت و بە شۆخییەوە لێت نزیک دەبێتەوە: «دەمزانی سەردەکەویت بۆ لای من... حەزت لە تامی شیرینە یان تامی مەترسیدار؟»',
          en: 'Warm mist curls off the glowing infinity pool on Floor 18. Aria slips a crystal glass into your fingers, leaning close in black-and-gold silk: “Knew you’d come up to see me… do you prefer things sweet, or dangerously bold?”',
        },
      },
    ],
    choices: [
      {
        id: 'a1_bold',
        style: 'bold',
        text: {
          ckb: '🔥 لە هەمان جامەکەی دەستی ئەو تامێک بکە و چاو لە چاوی ببڕە: «حەزم لە تامی هەڵبژاردنی تۆیە.»',
          en: '🔥 Take a sip right from the glass in her hand while holding her gaze: “Whatever taste is yours.”',
        },
        affectionDelta: 19,
        desireDelta: 18,
        trustDelta: 10,
        triggerHeartbeat: true,
        memory: {
          ckb: 'یەکەم شەو لە لای مەلەوانگەکە بە نیگایەکی بوێرانە ئاریات سەرسام کرد.',
          en: 'Left Aria blushing with an indirect kiss by the infinity pool.',
        },
        followUpBeats: [
          {
            speaker: 'aria',
            image: '/assets/aria_blush.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            unlockCg: 'aria_blush',
            text: {
              ckb: 'تەنانەت ئاریای بوێریش بۆ چرکەیەک ڕوومەتەکانی سوور هەڵدەگەڕێن! «ئۆهـ! کەواتە یاریزانێکی شارەزایت... زۆرم بەدڵ بوو!»',
              en: 'Even confident Aria blushes crimson for a beat, biting her lip with a thrilled smile: “Oh! Smooth move… now you really have my attention!”',
            },
          },
        ],
      },
      {
        id: 'a1_playful',
        style: 'playful',
        text: {
          ckb: '😏 گرەوێکی لەگەڵ بکە لەسەر دروستکردنی خۆشترین خواردنەوەی ئەمشەو.',
          en: '😏 Challenge her to a midnight mixology wager behind the bar.',
        },
        affectionDelta: 15,
        desireDelta: 12,
        trustDelta: 12,
        followUpBeats: [
          {
            speaker: 'aria',
            image: '/assets/aria_normal.jpg',
            camera: 'close',
            text: {
              ckb: 'بە جۆشەوە دەستت دەگرێت: «قبووڵمە! ئەگەر بردتەوە، نهێنییەکی ئەم هۆتێلەت پێ دەڵێم.»',
              en: 'She laughs brightly and grabs your wrist: “Deal! Win, and I’ll whisper a VIP secret in your ear.”',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'aria_ch2',
    heroine: 'aria',
    chapterNum: 2,
    requiredAffection: 25,
    location: 'pool',
    title: { ckb: 'پەردە ئاوریشمییەکانی کەپری تایبەت', en: 'Behind Silk Cabana Curtains' },
    introBeats: [
      {
        speaker: 'aria',
        image: '/assets/aria_blush.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        text: {
          ckb: 'ئاریا دەتباتە ناو کەپرێکی مۆمداری تەنیشت مەلەوانگەکە و پەردە ئاوریشمییەکان دادەداتەوە. بە پۆشاکێکی ئاوریشمیی ڕەش و زێڕینەوە لە تەنیشتت دادەنیشێت: «دەرەوە سارد بووە... وەرە نزیکم با گەرمت بکەمەوە.»',
          en: 'Aria draws the sheer silk curtains around a candlelit poolside cabana, sitting right beside you on the plush daybed: “Getting chilly out there… slide closer and warm up with me.”',
        },
      },
    ],
    choices: [
      {
        id: 'a2_close',
        style: 'bold',
        text: {
          ckb: '🔥 قۆڵت بخە دەوری شانی و پەنجەکانت بە نەرمی بەسەر قۆڵە گەرمەکەیدا بهێنە.',
          en: '🔥 Draw her snugly against your side and trace warm circles along her shoulder.',
        },
        affectionDelta: 24,
        desireDelta: 22,
        trustDelta: 14,
        triggerHeartbeat: true,
        memory: {
          ckb: 'لە ناو کەپری مۆمداری مەلەوانگەکەدا کاتێکی گەرم و نزیکت لەگەڵ ئاریا بەسەر برد.',
          en: 'Shared an intimate candlelit evening inside Aria’s private cabana.',
        },
        followUpBeats: [
          {
            speaker: 'aria',
            image: '/assets/aria_blush.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            text: {
              ckb: 'ئاریا خۆی دەخاتە ناو باوەشت و سەری بەرز دەکاتەوە بۆ سەیرکردنی لێوت: «دەستەکانت وەک ئاگر گەرمن... مەچۆرەوە خوارەوە ئەمشەو.»',
              en: 'She melts against your side, tilting her chin up with parted lips: “Your hands are dangerously warm… don’t go back downstairs tonight.”',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'aria_ch3',
    heroine: 'aria',
    chapterNum: 3,
    requiredAffection: 60,
    location: 'balcony',
    title: { ckb: 'دیوی ڕاستەقینەی دڵی ئاریا', en: 'Beneath the Glitter' },
    introBeats: [
      {
        speaker: 'aria',
        image: '/assets/aria_blush.jpg',
        camera: 'close',
        text: {
          ckb: 'لەسەر باڵکۆنەکە ئاریا بۆ یەکەم جار زەردەخەنە شۆخەکەی لادەبات: «هەموو میوانە دەوڵەمەندەکان تەنها وەک ڕوخسارێکی جوان سەیرم دەکەن... تۆ تاکە کەسیت کە گوێت لە خەونە ڕاستەقینەکانی من گرت. هەروەها من بینیم کێ چووە لای ژووری یاقووتەکە!»',
          en: 'Out on the quiet terrace, Aria lets her playful mask slip: “Everyone up here only sees the glamorous hostess… you’re the first person who actually sees me. And because I trust you—I saw the hotel owner tamper with the ruby vault himself!”',
        },
      },
    ],
    choices: [
      {
        id: 'a3_cherish',
        style: 'tender',
        text: {
          ckb: '💖 ڕوومەتەکانی لە ناو هەردوو دەستتدا بگرە: «بۆ من تۆ لە هەموو خشڵێکی ئەم جیهانە بەنرخترت.»',
          en: '💖 Cup both her cheeks gently: “To me, you outshine every jewel in this building.”',
        },
        affectionDelta: 28,
        desireDelta: 20,
        trustDelta: 26,
        triggerHeartbeat: true,
        memory: {
          ckb: 'ئاریا متمانەی تەواوی پێ کردیت و نهێنیی ساختەکاریی خاوەن هۆتێلەکەی پێ وتیت.',
          en: 'Aria trusted you with her heart and her eyewitness secret.',
        },
        followUpBeats: [
          {
            speaker: 'aria',
            image: '/assets/cg_aria_ending.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            text: {
              ckb: 'چاوەکانی ئاریا پڕ دەبن لە بریسکەی عەشق و ماچێکی گەرم و خێرا لە لای لێوت دادەنێت!',
              en: 'Aria’s eyes glisten with emotion before she steals a warm, breathless kiss at the corner of your lips!',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'aria_ch4',
    heroine: 'aria',
    chapterNum: 4,
    requiredAffection: 105,
    location: 'suite',
    title: { ckb: 'میوانی نیوەشەو بە شەربەتی زێڕینەوە', en: 'Midnight Room Service for Two' },
    introBeats: [
      {
        speaker: 'aria',
        image: '/assets/aria_blush.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        text: {
          ckb: 'ئاریا بە کلیدی تایبەتی VIP دێتە ناو سویتی ١٧٠٩ بە دوو جام کریستاڵ و مۆمی بۆنخۆشەوە: «وتم خزمەتگوزاریی ژوورەکەت خۆم بۆت دەهێنم... بەڵام ئەمشەو ناگەڕێمەوە نهۆمی ١٨.»',
          en: 'Aria slips into Suite 1709 with two sparkling crystal flutes and scented candles: “Special VIP delivery… and no, the hostess isn’t going back upstairs tonight.”',
        },
      },
    ],
    choices: [
      {
        id: 'a4_pull',
        style: 'bold',
        text: {
          ckb: '🔥 جامەکان لەسەر مێزەکە دابنێ و ڕاستەوخۆ ڕایبکێشە ناو باوەشی خۆت.',
          en: '🔥 Set the glasses aside immediately and pull her breathless into your arms.',
        },
        affectionDelta: 32,
        desireDelta: 32,
        trustDelta: 22,
        triggerHeartbeat: true,
        memory: {
          ckb: 'ئاریا شەوێکی ڕۆمانسیی پڕ لە گەرمیی لە سویتی ١٧٠٩ لەگەڵ بەسەر بردیت.',
          en: 'Shared an intoxicating late-night rendezvous with Aria in Suite 1709.',
        },
        followUpBeats: [
          {
            speaker: 'aria',
            image: '/assets/cg_aria_ending.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            unlockCg: 'cg_aria_ending',
            text: {
              ckb: 'قۆڵەکانی لە دەوری ملت دەئاڵێنێت بە پێکەنینێکی نەرم و لێوێکی گەرمەوە: «دەمزانی ناتوانیت چاوەڕێ بکەیت... منیش هەروا!»',
              en: 'She loops her arms around your neck with a breathless laugh against your lips: “Knew you wouldn’t wait… neither could I!”',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'aria_ch5',
    heroine: 'aria',
    chapterNum: 5,
    requiredAffection: 155,
    location: 'pool',
    title: { ckb: 'ئەفسوونی کەپری سەربان — پەیمانی ئاریا', en: 'Cabana Fever — Aria’s Heart' },
    introBeats: [
      {
        speaker: 'aria',
        image: '/assets/cg_aria_ending.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        unlockCg: 'cg_aria_ending',
        text: {
          ckb: 'لە ناو کەپرە تایبەتەکەی سەرباندا لەژێر ڕووناکیی مۆم و مەلەوانگەکە، ئاریا نێوچەوانی دەنێت بە نێوچەوانتەوە: «تەواوی ژیانم چاوەڕێی کەسێکی وەک تۆ بووم... ببە بە هی من.»',
          en: 'Inside the candlelit rooftop cabana, Aria presses her forehead softly to yours: “My whole life I waited for someone who makes my heart race like this… be mine tonight and every night after.”',
        },
      },
    ],
    choices: [
      {
        id: 'a5_kiss',
        style: 'bold',
        text: {
          ckb: '❤️‍🔥 لە ناو تیشکی زێڕینی کەپرەکەدا ماچێکی گەرم و پڕ لە عەشقی بکە!',
          en: '❤️‍🔥 Kiss her deeply under the warm golden cabana lights!',
        },
        affectionDelta: 35,
        desireDelta: 35,
        trustDelta: 25,
        triggerHeartbeat: true,
        memory: {
          ckb: 'گەیشتیتە ئاستی ٥ (خۆشەویستی ئاگرین) لەگەڵ ئاریا لە سەربانی نهۆمی ١٨.',
          en: 'Reached Rank 5 Passionate Lover with Aria!',
        },
        followUpBeats: [
          {
            speaker: 'narrator',
            image: '/assets/cg_aria_ending.jpg',
            camera: 'intimate_zoom',
            effect: 'warm_glow',
            text: {
              ckb: 'پەیوەندیت لەگەڵ ئاریا گەیشتە بەرزترین پلە (ئاستی ٥: خۆشەویستی ئاگرین)!',
              en: 'Your bond with Aria has reached Rank 5: Passionate Lover!',
            },
          },
        ],
      },
    ],
  },
];

// Repeatable Mood-Reactive Date Helper so every phase at any location feels juicy and alive!
export function buildDynamicDateScene(
  heroine: HeroineId,
  location: LocationId
): { beats: SceneBeat[]; choices: EncounterChoice[] } {
  const artMap: Record<HeroineId, { normal: string; blush: string; nameCkb: string; nameEn: string }> = {
    layla: {
      normal: '/assets/layla_normal.jpg',
      blush: '/assets/layla_blush.jpg',
      nameCkb: 'لەیلا',
      nameEn: 'Layla',
    },
    celine: {
      normal: '/assets/celine_normal.jpg',
      blush: '/assets/celine_blush.jpg',
      nameCkb: 'سێلین',
      nameEn: 'Celine',
    },
    aria: {
      normal: '/assets/aria_normal.jpg',
      blush: '/assets/aria_blush.jpg',
      nameCkb: 'ئاریا',
      nameEn: 'Aria',
    },
  };
  const info = artMap[heroine];

  const locFlavor: Record<LocationId, { ckb: string; en: string }> = {
    lounge: {
      ckb: `لە گۆشە مۆمدارەکەی هۆڵی مۆسیقاکە، ${info.nameCkb} بە نیگایەکی گەرمەوە پێشوازیت لێ دەکات و جێگەیەکت لە تەنیشت خۆی بۆ چۆڵ دەکات.`,
      en: `In a candlelit booth of the Velvet Lounge, ${info.nameEn} welcomes you with a lingering gaze and pats the velvet seat right beside her.`,
    },
    pool: {
      ckb: `لە قەراغی مەلەوانگە گەرمەکەی سەربان لە ناو هەڵمی نەرم و ڕووناکیی شەوانەدا، ${info.nameCkb} لێت نزیک دەبێتەوە.`,
      en: `Beside the steaming infinity pool under glowing fairy lights, ${info.nameEn} steps close to share the midnight view with you.`,
    },
    fireplace: {
      ckb: `لە بەردەم گەرمیی ئاگردانەکەدا، تیشکی پشکۆکان دەدرێتەوە لە چاوەکانی ${info.nameCkb} کاتێک بە تەنها دەتانبینێت.`,
      en: `Warm amber firelight dances across ${info.nameEn}’s face as the two of you find a quiet moment alone together.`,
    },
    balcony: {
      ckb: `لەژێر نمەی باران و فانۆسەکانی باڵکۆنە ئاسمانییەکەدا، شانی ${info.nameCkb} بەر شانت دەکەوێت.`,
      en: `Beneath warm terrace lanterns and misty night rain, ${info.nameEn} leans right against your shoulder.`,
    },
    boutique: {
      ckb: `${info.nameCkb} بە سەرسامییەوە لە تەنیشتت سەیری عەترە دەگمەنەکان دەکات.`,
      en: `${info.nameEn} browses the midnight fragrance counter right beside you.`,
    },
    suite: {
      ckb: `لە ناو کەشی ئارام و تایبەتی سویتی ١٧٠٩دا، ${info.nameCkb} بە هەناسەیەکی نزیکەوە سەیرت دەکات.`,
      en: `Inside the private warmth of Suite 1709, ${info.nameEn} looks up at you with soft, expectant eyes.`,
    },
  };

  return {
    beats: [
      {
        speaker: 'narrator',
        image: info.normal,
        camera: 'close',
        text: locFlavor[location],
      },
    ],
    choices: [
      {
        id: 'dyn_bold',
        style: 'bold',
        text: {
          ckb: '🔥 زۆر لێی نزیک ببەرەوە، پەنجەیەک بە دەستیدا بهێنە و بە بوێرییەوە وەسفی جوانیی ئەمشەوی بکە.',
          en: '🔥 Step intimately close, brush her hand, and whisper how breathtaking she looks tonight.',
        },
        affectionDelta: 14,
        desireDelta: 15,
        trustDelta: 6,
        triggerHeartbeat: true,
        followUpBeats: [
          {
            speaker: heroine,
            image: info.blush,
            camera: 'intimate_zoom',
            effect: 'heartbeat',
            text: {
              ckb: `ڕوومەتەکانی ${info.nameCkb} سوور هەڵدەگەڕێن و هەنگاوێک پێتەوە نزیکتر دەبێتەوە: «کاتێک ئاوا قسە دەکەیت، هەموو خۆڕاگریم لەدەست دەدەم...»`,
              en: `${info.nameEn}’s cheeks flush warm rose as she leans into your touch: “Keep talking like that and I won’t be responsible for what happens next…”`,
            },
          },
        ],
      },
      {
        id: 'dyn_tender',
        style: 'tender',
        text: {
          ckb: '💖 بە دڵسۆزی و نەرمی گوێی لێ بگرە و کاتێکی ئارام و پڕ لە متمانەی لەگەڵ بەسەر ببە.',
          en: '💖 Listen attentively to her feelings and comfort her warmly beside you.',
        },
        affectionDelta: 15,
        desireDelta: 8,
        trustDelta: 15,
        followUpBeats: [
          {
            speaker: heroine,
            image: info.blush,
            camera: 'close',
            effect: 'warm_glow',
            text: {
              ckb: `${info.nameCkb} بە بزەیەکی شیرینەوە سەری دەخاتە سەر شانت: «تەنها لای تۆ دەتوانم بەم شێوەیە خۆم بم.»`,
              en: `${info.nameEn} rests her head softly against your shoulder: “Only with you can I let my guard down like this.”`,
            },
          },
        ],
      },
      {
        id: 'dyn_playful',
        style: 'playful',
        text: {
          ckb: '😏 بە شۆخییەکی زیرەکانە و یاریی چاوپێککەوتن دڵی خۆش بکە.',
          en: '😏 Tease her playfully with magnetic banter until she laughs.',
        },
        affectionDelta: 13,
        desireDelta: 11,
        trustDelta: 9,
        charmGain: 1,
        followUpBeats: [
          {
            speaker: heroine,
            image: info.blush,
            camera: 'close',
            text: {
              ckb: `${info.nameCkb} پێدەکەنێت و بە سووکی پەنجەیەک دەدات لە سینگت: «تۆ زۆر مەترسیداریت، دەزانیت؟»`,
              en: `${info.nameEn} laughs softly, tapping a finger against your lapel: “You’re way too charming for your own good, you know that?”`,
            },
          },
        ],
      },
    ],
  };
}

export const RUBY_CLUE_SCENES: Record<number, SceneBeat[]> = {
  1: [
    {
      speaker: 'narrator',
      image: '/assets/bg_lounge.jpg',
      camera: 'pan_left',
      effect: 'lightning',
      text: {
        ckb: '🔎 [بەڵگەی ١/٣ دۆزرایەوە!] لە پشتی مێزی ئەرشیفەکەدا پسووڵەیەکی نهێنیت دۆزییەوە: خاوەنی زیادکردنەکە ملوانکەی «دڵی یاقووت»ی بە قەرزێکی ساختە لە بنەماڵەی لەیلا زەوت کردبوو! (+90$ پاداشتی زانیاری)',
        en: '🔎 [CLUE 1/3 FOUND!] Behind the mahogany ledger, you uncover a forged deed: the auction host seized The Crimson Heart from Layla’s family through fraud! (+$90 Consulting Bonus)',
      },
    },
  ],
  2: [
    {
      speaker: 'narrator',
      image: '/assets/cover_keyart.jpg',
      camera: 'close',
      effect: 'warm_glow',
      text: {
        ckb: '🔎 [بەڵگەی ٢/٣ دۆزرایەوە!] تۆماری سیستەمی کارەبا دەیسەلمێنێت کە خودی خاوەنی هۆتێلەکە کارەباکەی کوژاندووەتەوە بۆ وەرگرتنی پارەی بیمە (Insurance Fraud)! (+110$ پاداشت)',
        en: '🔎 [CLUE 2/3 FOUND!] Security power logs prove the host triggered the blackout himself to stage an insurance scam! (+$110 Bonus)',
      },
    },
  ],
  3: [
    {
      speaker: 'narrator',
      image: '/assets/bg_penthouse.jpg',
      camera: 'intimate_zoom',
      effect: 'warm_glow',
      text: {
        ckb: '🔎 [بەڵگەی ٣/٣ تەواو بوو!] هەموو بەڵگە یاساییەکانت کۆکردەوە! ئێستا لە شەوی حەوتەمدا دەتوانیت ناوی هەمووان پاک بکەیتەوە و باشترین کۆتاییەکان مسۆگەر بکەیت! (+150$ پاداشت)',
        en: '🔎 [CLUE 3/3 COMPLETE!] Your dossier is airtight! On Night 7, you have total leverage to exonerate everyone and claim the ultimate ending! (+$150 Bonus)',
      },
    },
  ],
};

export const PHONE_THREADS: PhoneThread[] = [
  {
    id: 'dm_layla_1',
    heroine: 'layla',
    minNight: 1,
    minAffection: 10,
    opening: [
      {
        sender: 'her',
        image: '/assets/layla_blush.jpg',
        text: {
          ckb: 'هێشتا بێداریت؟ 🌙 لەسەر پیانۆکە دانیشتبووم و بیرم لای گەرمیی دەستەکانت بوو...',
          en: 'Still awake? 🌙 Sitting by the piano thinking about how warm your hands felt earlier…',
        },
      },
    ],
    options: [
      {
        style: 'bold',
        label: {
          ckb: '🔥 «ئەگەر ئێستا بێمە خوارەوە، چیم بۆ دەژەنیت بە تەنها؟»',
          en: '🔥 “If I come down right now, will you play only for me?”',
        },
        herReply: [
          {
            sender: 'her',
            text: {
              ckb: 'ئاوازێک کە نەهێڵێت تا بەرەبەیان چاوت لێک بنێیت... زوو وەرە لاتم 😉💚',
              en: 'A melody slow enough to keep your heart racing till dawn… come find me tomorrow 😉💚',
            },
          },
        ],
        affectionDelta: 12,
        desireDelta: 12,
        newMood: 'heated',
      },
      {
        style: 'tender',
        label: {
          ckb: '💖 «وێنەکەت زۆر سەرنجڕاکێشە لەیلا، شەوێکی ئارامت هەبێت.»',
          en: '💖 “You look breathtaking in candlelight, Layla. Dream of me.”',
        },
        herReply: [
          {
            sender: 'her',
            text: {
              ckb: 'ئێستا بە دڵنیاییەوە بە زەردەخەنەوە دەخەوم ❤️',
              en: 'Now I definitely won’t stop smiling in bed ❤️',
            },
          },
        ],
        affectionDelta: 10,
        desireDelta: 6,
        newMood: 'radiant',
      },
    ],
  },
  {
    id: 'dm_celine_1',
    heroine: 'celine',
    minNight: 1,
    minAffection: 10,
    opening: [
      {
        sender: 'her',
        image: '/assets/celine_blush.jpg',
        text: {
          ckb: 'تەنها بۆ بابەتی ئەمنی نامەت بۆ دەنێرم... دەرگای سویتەکەت باش داخراوە؟ (هەرچەندە... پێم خۆش بوو ئەمڕۆ بینیمیتەوە).',
          en: 'Just a routine security check… is your suite locked? (…Fine, maybe I just wanted an excuse to text you.)',
        },
      },
    ],
    options: [
      {
        style: 'bold',
        label: {
          ckb: '🔥 «بۆ تۆ هەمیشە دەرگاکەم کراوەیە، لێکۆڵەرە جوانەکە.»',
          en: '🔥 “For my favorite detective, my door is unlocked anytime.”',
        },
        herReply: [
          {
            sender: 'her',
            text: {
              ckb: 'وا قسە مەکە لە نیوەشەودا! دڵم خەریکە لە سینگم دێتە دەرەوە 😳💜',
              en: 'Don’t text things like that after midnight! My heart can’t take it 😳💜',
            },
          },
        ],
        affectionDelta: 13,
        desireDelta: 12,
        newMood: 'flirty',
      },
      {
        style: 'tender',
        label: {
          ckb: '💖 «منیش زۆر بیری تۆم کردبوو سێلین. بەیانی لە لای ئاگردانەکە یەک دەبینین.»',
          en: '💖 “I missed you more than you know, Celine. Meet me by the fire.”',
        },
        herReply: [
          {
            sender: 'her',
            text: {
              ckb: '...بەڵێن بێت چاوەڕێت دەکەم. شەوشاد 💕',
              en: '…I’ll be counting the hours. Goodnight 💕',
            },
          },
        ],
        affectionDelta: 12,
        desireDelta: 7,
        newMood: 'vulnerable',
      },
    ],
  },
  {
    id: 'dm_aria_1',
    heroine: 'aria',
    minNight: 1,
    minAffection: 10,
    opening: [
      {
        sender: 'her',
        image: '/assets/aria_blush.jpg',
        text: {
          ckb: 'ئاوەکەی مەلەوانگەی نهۆمی ١٨ ئەمشەو زۆر گەرم و بێدەنگە... تەنها یەک کەسی کەمە لە تەنیشتم 😉✨',
          en: 'The 18th-floor infinity pool is warm and misty tonight… only missing you beside me 😉✨',
        },
      },
    ],
    options: [
      {
        style: 'bold',
        label: {
          ckb: '🔥 «کەپرە تایبەتەکەم بۆ حەجز بکە، لەگەڵ خۆمدا سوپرایزت بۆ دەهێنم.»',
          en: '🔥 “Save the private cabana for two—I’m bringing my full attention.”',
        },
        herReply: [
          {
            sender: 'her',
            text: {
              ckb: 'ئۆهـ! مۆمەکانم هەر لە ئێستاوە بۆ داگیرساندیت 🔥💋',
              en: 'Ooh! Lighting the candles right now just for you 🔥💋',
            },
          },
        ],
        affectionDelta: 13,
        desireDelta: 14,
        newMood: 'heated',
      },
      {
        style: 'playful',
        label: {
          ckb: '😏 «بەو مەرجەی باشترین خواردنەوەی خۆتم بۆ ئامادە بکەیت!»',
          en: '😏 “Only if the hostess serves her secret reserve drink!”',
        },
        herReply: [
          {
            sender: 'her',
            text: {
              ckb: 'تایبەتترین تامی خۆمت پێشکەش دەکەم! زوو وەرە سەرەوە 🥂',
              en: 'My sweetest reserve has your name on it! Hurry up soon 🥂',
            },
          },
        ],
        affectionDelta: 11,
        desireDelta: 9,
        newMood: 'flirty',
      },
    ],
  },
  {
    id: 'dm_layla_2',
    heroine: 'layla',
    minNight: 3,
    minAffection: 55,
    opening: [
      {
        sender: 'her',
        text: {
          ckb: 'نهێنییەکت پێ بڵێم؟ عەترەکەی تۆ هێشتا لەسەر شالم ماوەتەوە و ناهێڵێت بخەوم... 🔥',
          en: 'Want a midnight confession? Your scent is still on my silk shawl and it’s driving me crazy… 🔥',
        },
      },
    ],
    options: [
      {
        style: 'bold',
        label: {
          ckb: '🔥 «کەواتە بهێڵە دووبارە لە نزیکەوە نوێی بکەمەوە لەسەر شانت.»',
          en: '🔥 “Then let me hold you close enough to leave it all over again.”',
        },
        herReply: [
          {
            sender: 'her',
            text: {
              ckb: 'سوێند دەخۆم تۆ شێتم دەکەیت... چاوەڕێتم لە سویتی ١٧٠٩ کاتێک گەیشتینە ئاستی ٤ ❤️‍🔥',
              en: 'You’re going to ruin me… invite me to Suite 1709 soon ❤️‍🔥',
            },
          },
        ],
        affectionDelta: 16,
        desireDelta: 16,
        newMood: 'heated',
      },
    ],
  },
  {
    id: 'dm_celine_2',
    heroine: 'celine',
    minNight: 3,
    minAffection: 55,
    opening: [
      {
        sender: 'her',
        text: {
          ckb: 'ئەمڕۆ کە لێت نزیک بوومەوە، هەمان ئەو هەستەم بۆ گەڕایەوە کە لە پاریس وام لێ دەکرد هەموو دونیا لەبیر بکەم... 💜',
          en: 'Standing close to you today brought back every breathless feeling from Paris… 💜',
        },
      },
    ],
    options: [
      {
        style: 'tender',
        label: {
          ckb: '💖 «ئەمجارە چیرۆکەکەمان لە پاریسیش جوانتر و گەرمتر دەبێت، سێلین.»',
          en: '💖 “This time we don’t stop at one summer, Celine. Come see me tonight.”',
        },
        herReply: [
          {
            sender: 'her',
            text: {
              ckb: 'دڵم زۆر خێرا لێ دەدات... چیتر لێت ڕاناکەم 💕',
              en: 'My pulse is racing just reading this… I’m not running anymore 💕',
            },
          },
        ],
        affectionDelta: 16,
        desireDelta: 14,
        newMood: 'heated',
      },
    ],
  },
  {
    id: 'dm_aria_2',
    heroine: 'aria',
    minNight: 3,
    minAffection: 55,
    opening: [
      {
        sender: 'her',
        text: {
          ckb: 'هەمووان ڕۆیشتوون و مەلەوانگەکەم تەنها بۆ من و تۆ قفڵ کردووە... دەوێریت سەربکەویت؟ 😉🔥',
          en: 'Locked the rooftop doors so it’s just the two of us by the heated water… dare to come up? 😉🔥',
        },
      },
    ],
    options: [
      {
        style: 'bold',
        label: {
          ckb: '🔥 «لە ڕێگام بۆ لات — پەردەی کەپرەکە ئامادە بکە.»',
          en: '🔥 “Already on my way—draw the cabana curtains.”',
        },
        herReply: [
          {
            sender: 'her',
            text: {
              ckb: 'بەپەرۆشەوە چاوەڕێتم خۆشەویستەکەم! ❤️‍🔥✨',
              en: 'Counting every second until you walk in! ❤️‍🔥✨',
            },
          },
        ],
        affectionDelta: 16,
        desireDelta: 16,
        newMood: 'heated',
      },
    ],
  },
];

export const FINALE_ENDINGS: Record<string, FinaleEnding> = {
  end_trio_crown: {
    id: 'end_trio_crown',
    number: 1,
    heroine: 'trio',
    image: '/assets/cg_double_ending.jpg',
    unlockCg: 'cg_double_ending',
    badge: { ckb: 'کۆتایی شاهانە ١ • تاجی مەخمەلی', en: 'Ending 1 • Secret Penthouse Crown' },
    title: { ckb: 'بەرەبەیانی شەیدایی بێسنوور', en: 'Sunrise of Unrivaled Desire' },
    beats: [
      {
        speaker: 'narrator',
        image: '/assets/cg_double_ending.jpg',
        camera: 'intimate_zoom',
        effect: 'warm_glow',
        unlockCg: 'cg_double_ending',
        text: {
          ckb: 'شەوی حەوتەم تەواو دەبێت و خۆری پەمەیی و زێڕین بەسەر شارەکەدا هەڵدێت! بە زیرەکی و کاریزمای بێهاوتات توانیت ساختەکاریی خاوەن هۆتێلەکە ئاشکرا بکەیت و لە هەمان کاتدا دڵی زیاتر لە یەک شاجوانی ئەم هۆتێلە بە تەواوی شەیدای خۆت بکەیت!',
          en: 'As the seventh night melts into a pink-and-gold sunrise, your investigative brilliance exposes the crooked host—while none of the captivating women who fell for you are willing to let you check out alone!',
        },
      },
      {
        speaker: 'all',
        image: '/assets/cg_double_ending.jpg',
        camera: 'close',
        effect: 'heartbeat',
        text: {
          ckb: 'لەیلا قردێلە مەخمەلییەکەی دەپێچێتە مەچەکت، سێلین دوو کوپ قاوەی گەرم دەهێنێتە تەنیشتت، و ئاریا کلیدی سویتی هەمیشەیی سەربانت دەخاتە گیرفانەوە: «گەشتەکەی ئێمە تازە دەست پێ دەکات!»',
          en: 'Layla loops her emerald ribbon around your wrist, Celine brings morning espressos with a tender blush, and Aria slips a permanent VIP rooftop key into your pocket: “Who said seven nights was the end?”',
        },
      },
    ],
    summary: {
      ckb: 'پیرۆزە! بەرزترین و دەگمەنترین کۆتایی یارییەکەت کردەوە بە بردنەوەی دڵی چەند کارەکتەرێک لە ئاستی ٤+!',
      en: 'Incredible! You reached Rank 4+ with multiple heroines and unlocked the Secret Penthouse Crown Ending!',
    },
  },
  end_layla_lover: {
    id: 'end_layla_lover',
    number: 2,
    heroine: 'layla',
    image: '/assets/cg_layla_ending.jpg',
    unlockCg: 'cg_layla_ending',
    badge: { ckb: 'کۆتایی ٢ • کۆتایی ڕاستەقینەی لەیلا', en: 'Ending 2 • Layla True Lover' },
    title: { ckb: 'ئاگری هەمیشەیی لەژێر باران', en: 'Eternal Flame Beneath the Rain' },
    beats: [
      {
        speaker: 'layla',
        image: '/assets/cg_layla_ending.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        unlockCg: 'cg_layla_ending',
        text: {
          ckb: 'لە کۆتا شەوی حەوتەمدا، ملوانکەی «دڵی یاقووت» بە فەرمی دەگەڕێتەوە سەر گەردنی لەیلا. لەسەر باڵکۆنە باراناوییەکە چاکەتەکەی تۆی لەبەردایە و بە ماچێکی گەرم و قووڵ دەچرپێنێت: «تۆ لە هەموو گەوهەرێکی ئەم جیهانە بۆ من گرانبەهاتریت... چیتر هەموو شەوێکم هی تۆیە.»',
          en: 'On Night 7, The Crimson Heart is officially restored to Layla. Wrapped in your coat under warm terrace lanterns, she seals your bond with a breathless kiss: “Every jewel in the world pales beside you… from tonight on, my heart belongs only to you.”',
        },
      },
    ],
    summary: {
      ckb: 'دڵی لەیلا و متمانەی تەواویت بەدەست هێنا و بەیەکەوە ژیانێکی پڕ لە گەرمی و مۆسیقاتان دەست پێ کرد.',
      en: 'You won Layla’s complete devotion and reclaimed her mother’s heirloom together.',
    },
  },
  end_celine_lover: {
    id: 'end_celine_lover',
    number: 3,
    heroine: 'celine',
    image: '/assets/cg_celine_ending.jpg',
    unlockCg: 'cg_celine_ending',
    badge: { ckb: 'کۆتایی ٣ • کۆتایی ڕاستەقینەی سێلین', en: 'Ending 3 • Celine True Lover' },
    title: { ckb: 'کۆتایی دابڕان و گەرمیی عەشق', en: 'No More Goodbyes After Midnight' },
    beats: [
      {
        speaker: 'celine',
        image: '/assets/cg_celine_ending.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        unlockCg: 'cg_celine_ending',
        text: {
          ckb: 'دۆسیەی دزییەکە بە سەرکەوتوویی دادەخرێت و سێلین لەبەردەم ئاگردانەکەدا توند یەخەی پاڵتۆکەت دەگرێت و ماچت دەکات: «دوو بلیتی گەڕانەوە بۆ پاریسم بڕیوە... ئەمجارە تا کۆتایی تەمەن بەیەکەوە لەژێر بارانەکەیدا پیاسە دەکەین.»',
          en: 'With the fraud case solved, Celine pulls your lapels close before the glowing hearth in a fierce, tender kiss: “I booked two tickets back to Paris… and this time, I’m waking up beside you every single morning.”',
        },
      },
    ],
    summary: {
      ckb: 'عەشقە کۆنەکەی پاریست زیندوو کردەوە بۆ پەیوەندییەکی هەمیشەیی و پڕ لە سۆز لەگەڵ سێلین!',
      en: 'You healed the past and turned two years of longing into forever with Celine!',
    },
  },
  end_aria_lover: {
    id: 'end_aria_lover',
    number: 4,
    heroine: 'aria',
    image: '/assets/cg_aria_ending.jpg',
    unlockCg: 'cg_aria_ending',
    badge: { ckb: 'کۆتایی ٤ • کۆتایی ڕاستەقینەی ئاریا', en: 'Ending 4 • Aria True Lover' },
    title: { ckb: 'شەوانی زێڕینی نهۆمی هەژدەیەم', en: 'Golden Nights Above the Skyline' },
    beats: [
      {
        speaker: 'aria',
        image: '/assets/cg_aria_ending.jpg',
        camera: 'intimate_zoom',
        effect: 'heartbeat',
        unlockCg: 'cg_aria_ending',
        text: {
          ckb: 'لە ناو کەپری ئاوریشمی و ڕووناکیی مەلەوانگەی سەرباندا، ئاریا قۆڵەکانی لە گەردنت دەئاڵێنێت و بە تامەزرۆییەوە ماچت دەکات: «ئەم هۆتێلە و هەموو شارەکە شایەتن... تۆ تاکە کەسیت کە دڵی ئاریات داگیر کرد!»',
          en: 'Inside her candlelit poolside cabana above the glittering city, Aria wraps her arms around your neck in a passionate kiss: “The whole skyline can watch—my heart is officially yours forever!”',
        },
      },
    ],
    summary: {
      ckb: 'بوویتە هاوبەشی ژیان و شەوانی پڕ لە جۆش و خۆشەویستیی ئاریا!',
      en: 'You claimed Aria’s heart and became partners in luxury and romance above the city lights!',
    },
  },
  end_sweet_spark: {
    id: 'end_sweet_spark',
    number: 5,
    heroine: 'solo',
    image: '/assets/cover_keyart.jpg',
    unlockCg: 'cover_keyart',
    badge: { ckb: 'کۆتایی ٥ • بریسکەی تەواونەکراو', en: 'Ending 5 • Lingering Spark' },
    title: { ckb: 'بەڵێنی دیداری داهاتوو', en: 'Promise of Another Winter Night' },
    beats: [
      {
        speaker: 'narrator',
        image: '/assets/cover_keyart.jpg',
        camera: 'normal',
        text: {
          ckb: 'حەوت شەوەکە کۆتایی هات لەگەڵ چەندین یادگاریی شیرین و نیگای گەرم، هەرچەندە هێشتا نەگەیشتیتە ئاستی ٤ یان ٥ لەگەڵ یەکێکیان. لە کاتی ڕۆیشتندا ژمارەی تەلەفۆنی تایبەت و زەردەخەنەیەکی پڕ لە بەڵێن وەردەگریت بۆ دیدارێکی تر!',
          en: 'Seven nights fly by in a whirl of warm glances and whispered promises. Though you didn’t reach Rank 4+ Lover status yet, a scented note and private phone number slip into your coat pocket as you leave!',
        },
      },
    ],
    summary: {
      ckb: 'بۆ کردنەوەی کۆتاییە ئاگرینەکان، لە یاریی داهاتوودا پەیوەندیی یەکێک لە کچەکان بگەیەنە ئاستی ٤ یان ٥ (Affection ≥ 105)!',
      en: 'Tip: Reach Rank 4+ (Affection ≥ 105) with Layla, Celine, or Aria—or multiple!—to unlock their True Passionate Endings!',
    },
  },
};
