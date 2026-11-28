import {
  EncounterChoice,
  HeroineId,
  LocalizedText,
  LocationId,
  SceneBeat,
} from '../types/game';

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
    choices?: EncounterChoice[];
  };
  spaObject?: {
    label: LocalizedText;
    discoveryTitle: LocalizedText;
    beats: SceneBeat[];
    choices: EncounterChoice[];
  };
}

export const TOWER_HOTSPOTS: TowerHotspot[] = [
  {
    id: 'roof_cabana',
    floorLabel: '18F ROOF',
    mappedLoc: 'pool',
    privateOwner: 'aria',
    xPercent: 33,
    yPercent: 11,
    icon: '⛺',
    title: { ckb: 'کەپر و جاکوزیی سەربان', en: 'Rooftop Cabana & Jacuzzi (18F)' },
    sub: { ckb: 'پەردەی ئاوریشم و جاکوزیی کەفداری ئاریا', en: 'Aria’s Candlelit Cabana & Foam Spa' },
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
            ckb: 'کاتێک پەردە ئاوریشمییەکەی سەربان لادەدەیت، دەبینیت ئاریا بە عەزییە شەرابییە تەنکەکەیەوە لەبەر ڕووناکیی مۆمەکان چاوەڕێتە! دەستت ڕادەکێشێتە ژوورەوە: «پێشبینیم نەدەکرد بەم درەنگە بێیتە سەربان... مادام خۆت پەردەکەت لادا، ئەمشەو لەم کەپرە ناچیتە دەرەوە!»',
            en: 'Parting the silk curtains, you catch Aria lounging in her wine-red lace dress by candlelight—she pulls you inside: “Now that you’re in here, I’m keeping you.”',
          },
        },
      ],
    },
    spaObject: {
      label: { ckb: '🌫️ چوونە لای جاکوزییە تەمگرتووەکەی ئاریا', en: '🌫️ Approach Aria’s Steaming Foam Jacuzzi' },
      discoveryTitle: { ckb: 'جاکوزیی هەڵم و کەفی سەربان', en: 'Steamy Rooftop Foam Jacuzzi' },
      beats: [
        {
          speaker: 'narrator',
          image: '/assets/aria_spa.jpg',
          camera: 'close',
          text: {
            ckb: 'لە گۆشە تایبەتەکەی سەرباندا هەورێکی چڕی هەڵمی گەرم بەرز دەبێتەوە و شوشەکانی تەڵخ کردووە. کاتێک لێی نزیک دەبیتەوە، لە ناو کەفە سپییەکەدا ئاریا دەردەکەوێت کە دڵۆپە ئاو بەسەر شان و گەردنییەوە دەخلیسکێت...',
            en: 'Thick warm steam clouds blur the glass around the private rooftop jacuzzi. Stepping closer, you spot Aria chest-deep in white foam, water glistening on her bare shoulders.',
          },
        },
        {
          speaker: 'aria',
          image: '/assets/aria_spa.jpg',
          camera: 'intimate_zoom',
          effect: 'heartbeat',
          unlockCg: 'aria_spa',
          text: {
            ckb: 'ئاریا لە ناو هەڵم و کەفەکەوە بە زەردەخەنەیەکی زۆر وروژێنەرەوە سەیرت دەکات و بێ هیچ شەرمێک بانگت دەکات: «چییە، لە پشت هەڵمەکەوە وەستاویت سەیرم دەکەیت؟ خاولییەکەم لە تەنیشتت دانراوە... یاخود دەوێریت زیاتر نزیک ببیتەوە؟»',
            en: 'Aria gazes up through the swirling steam with a bold, teasing blush: “Standing back there watching through the mist? My towel’s right beside you… or are you bold enough to come closer?”',
          },
        },
      ],
      choices: [
        {
          id: 'aria_spa_bold',
          style: 'bold',
          triggerHeartbeat: true,
          text: { ckb: '🔥 هەڵمی سەر شوشەکە بسڕە و دانیشە لەسەر لێواری جاکوزییەکە لە تەنیشتی', en: '🔥 Wipe the steam away and sit right at the edge beside her' },
          affectionDelta: 14,
          desireDelta: 18,
          trustDelta: 6,
          followUpBeats: [
            {
              speaker: 'aria',
              image: '/assets/aria_spa.jpg',
              camera: 'intimate_zoom',
              effect: 'warm_glow',
              text: {
                ckb: 'ئاریا دەستە تەڕ و گەرمەکەی لە ناو کەفەکەوە دەردەهێنێت و دەیخاتە سەر ڕووخسارت، هەناسەی تەواو تێکەڵی هەڵمەکە دەبێت: «تەواو شێتم دەکەیت... حەزم لەم بوێرییەی تۆیە. ئەمشەو تا ئاوەکە سارد دەبێتەوە لێرە ناڕۆین.»',
                en: 'She reaches a warm, wet hand from the foam to cup your jaw, her breath mingling with the mist: “God, I love how fearless you are… stay right here with me.”',
              },
            },
          ],
        },
        {
          id: 'aria_spa_tender',
          style: 'tender',
          text: { ckb: '💖 خاولییە گەرمەکە هەڵبگرە و بیدە بەسەر شانە تەڕەکانیدا', en: '💖 Drape the warm spa towel gently around her wet shoulders' },
          affectionDelta: 12,
          desireDelta: 14,
          trustDelta: 10,
          followUpBeats: [
            {
              speaker: 'aria',
              image: '/assets/aria_spa.jpg',
              camera: 'close',
              effect: 'heartbeat',
              text: {
                ckb: 'کاتێک خاولییەکەی لێوە دەپێچیت، خۆی دەنووسێنێت بە سنگتەوە: «ئەوەندە بە سۆزیت کە وا دەکەیت دڵم خێراتر لەم ئاوە بکوڵێت...»',
                en: 'As you wrap the warm towel around her, she leans warmly against your chest: “You’re making my heart race faster than this heat…”',
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'roof_pool',
    floorLabel: '18F POOL',
    mappedLoc: 'pool',
    xPercent: 67,
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
    title: { ckb: 'ژووری خەو و گەرماوی ١٧٠٩', en: 'Suite 1709 & Marble Bath' },
    sub: { ckb: 'سیسەمی مەخمەلی و بانیۆی کەف و گوڵی لەیلا', en: 'Master Bedroom & Rose-Foam Bath' },
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
            ckb: 'لەیلا بە جلی خەوی ئاوریشمی سوور و ڕۆبێکی مەخمەلییەوە دێتە ژوورەوە و لەسەر سیسەمەکە دادەنیشێت! «تەواو ئاشکرا بووم... دەرگاکە دابخە و وەرە تەنیشتم.»',
            en: 'Layla enters in her crimson satin nightgown and velvet robe, blushing on the bed: “Lock the door and come sit beside me.”',
          },
        },
      ],
    },
    spaObject: {
      label: { ckb: '🌫️ کردنەوەی دەرگای گەرماوە هەڵمدارەکەی لەیلا', en: '🌫️ Open the Steamy Marble Bathroom Door' },
      discoveryTitle: { ckb: 'بانیۆی کەف و گوڵەباخی لەیلا', en: 'Layla’s Rose-Foam Marble Bath' },
      beats: [
        {
          speaker: 'narrator',
          image: '/assets/layla_spa.jpg',
          camera: 'close',
          text: {
            ckb: 'دەرگای گەرماوە مەڕمەڕییەکە بە نیوەیی کراوەتەوە و شەپۆلێکی هەڵمی گەرم و بۆنی گوڵەباخ پێشوازیت لێ دەکات. لە پشت تەمە چڕەکەوە، لەیلا لە ناو کەفی سپی و پەڕەی گوڵە سوورەکاندا پاڵکەوتووە...',
            en: 'Warm rose-scented steam spills through the half-open marble bathroom door. Through the mist, Layla rests shoulder-deep in thick white foam and crimson petals.',
          },
        },
        {
          speaker: 'layla',
          image: '/assets/layla_spa.jpg',
          camera: 'intimate_zoom',
          effect: 'heartbeat',
          unlockCg: 'layla_spa',
          text: {
            ckb: 'لەیلا بە قژە تەڕەکەیەوە سەرت لێ بادەدات؛ لەبری ئەوەی خۆی بشارێتەوە، بە بزەیەکی گەرم و چاوێکی خومارەوە دەڵێت: «دەرگاکەم بە ئەنقەست قفڵ نەدا چونکە دەمزانی دێیت... لە بەر دەرگاکە مەوەستە با هەڵمەکە دەرنەچێت، وەرە ژوورەوە.»',
            en: 'With damp dark curls framing her flushed cheeks, Layla smiles languidly through the steam: “I left the bathroom unlocked on purpose because I knew it would be you… come inside and shut the door.”',
          },
        },
      ],
      choices: [
        {
          id: 'layla_spa_bold',
          style: 'bold',
          triggerHeartbeat: true,
          text: { ckb: '🔥 دەرگاکە دابخە، هەڵمەکە بسڕە و لە تەنیشت بانیۆکە چۆک دابدە', en: '🔥 Shut the door, clear the mist, and kneel right beside her bath' },
          affectionDelta: 15,
          desireDelta: 19,
          trustDelta: 7,
          followUpBeats: [
            {
              speaker: 'layla',
              image: '/assets/layla_spa.jpg',
              camera: 'intimate_zoom',
              effect: 'warm_glow',
              text: {
                ckb: 'لەیلا پەنجە گەرم و کەفدارەکانی بە سەر مەچەک و لێوتدا دەهێنێت و بە چرپە دەڵێت: «سەیرکردنەکەت ئاوی ناو ئەم بانیۆیەش گەرمتر دەکات... بۆم بهێنە ڕۆبە ئاوریشمییەکەم و با بچینە سەر سیسەمەکە.»',
                en: 'Her warm, foam-kissed fingers trace your wrist and lips: “The way you look at me makes even this water feel cool… hand me my silk robe and carry me out.”',
              },
            },
          ],
        },
        {
          id: 'layla_spa_playful',
          style: 'playful',
          text: { ckb: '😏 «کەواتە داوت بۆ نابوومەوە؟» — تاڵە قژە تەڕەکانی لەسەر ڕوومەتی لابدە', en: '😏 “So you set a trap for me?” — brush a wet curl off her cheek' },
          affectionDelta: 13,
          desireDelta: 15,
          trustDelta: 8,
          followUpBeats: [
            {
              speaker: 'layla',
              image: '/assets/layla_spa.jpg',
              camera: 'close',
              effect: 'heartbeat',
              text: {
                ckb: 'ڕوومەتی دەخاتە ناو لەپی دەستتەوە و چاوی دادەخات: «جوانترین داو... و تۆش بە پێی خۆت هاتیتە ناوی.»',
                en: 'She leans her warm cheek into your palm with a soft laugh: “My favorite trap… and you walked right into it.”',
              },
            },
          ],
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
    title: { ckb: 'ژوور و گەرماوی تایبەتی سێلین', en: 'Celine’s Suite & Shower (16F)' },
    sub: { ckb: 'ژووری خەو و حەمامی شوشەیی سێلین', en: 'Celine’s Quarters & Frosted Glass Shower' },
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
            ckb: 'سێلین لەسەر سیسەمەکە بە جلی خەوی ئاوریشمی سپییەوە دانیشتووە و ڕوومەتی دەسووتێت لە شەرمدا: «باشە... هێشتا هەموو شەوێک پێش خەوتن سەیری وێنەکەمان دەکەم!»',
            en: 'Celine sits on her bed in pearl-white silk nightwear, blushing deeply: “Fine… I still keep our photo beside my pillow every night!”',
          },
        },
      ],
    },
    spaObject: {
      label: { ckb: '🌫️ ڕووبەڕووبوونەوە لەبەردەم حەمامە هەڵمدارەکەی سێلین', en: '🌫️ Step Toward Celine’s Steamy Shower Glass' },
      discoveryTitle: { ckb: 'پشت شوشە تەمگرتووەکەی سێلین', en: 'Celine Behind Frosted Steam' },
      beats: [
        {
          speaker: 'narrator',
          image: '/assets/celine_spa.jpg',
          camera: 'close',
          text: {
            ckb: 'دەنگی ئاوی گەرم تازە وەستاوە و تەواوی ژوورەکە پڕ بووە لە هەوری سپی و تەمی سەر شوشەکە. لەناکاو دەرگا شوشەییەکە دەکرێتەوە و سێلین بە خاولییەکی سپییەوە ڕێک لەبەردەمت دەردەکەوێت!',
            en: 'The warm shower just turned off, filling the suite with thick white steam. Suddenly the frosted glass slides open and Celine steps out clutching a white bath towel!',
          },
        },
        {
          speaker: 'celine',
          image: '/assets/celine_spa.jpg',
          camera: 'intimate_zoom',
          effect: 'lightning',
          unlockCg: 'celine_spa',
          text: {
            ckb: 'سێلین لە شۆک و شەرمدا لە جێی خۆی وشک دەبێت، خاولییەکە توندتر بە سنگییەوە دەگرێت و تەواوی ڕووخسار و شانە تەڕەکانی سوور هەڵدەگەڕێن: «تـ-تۆ چۆن هێشتا لێرەیت؟! وتم لە هۆڵەکە چاوەڕێم بکە! ئـ-ئاوڕ بدەرەوە سەیرم مەکە ئاوا!»',
            en: 'Celine freezes in the swirling steam, clutching the towel tight against her chest as acrimson blush spreads down her wet shoulders: “W-Why are you right outside the shower?! Don’t stare at me like that!”',
          },
        },
      ],
      choices: [
        {
          id: 'celine_spa_bold',
          style: 'bold',
          triggerHeartbeat: true,
          text: { ckb: '🔥 هەنگاوێک بچۆ ناو هەڵمەکە و بە نەرمی دەست بخەرە سەر شانی: «بۆچی چاوم لابەم؟»', en: '🔥 Step into the steam and touch her warm shoulder: “Why look away?”' },
          affectionDelta: 15,
          desireDelta: 19,
          trustDelta: 6,
          followUpBeats: [
            {
              speaker: 'celine',
              image: '/assets/celine_spa.jpg',
              camera: 'intimate_zoom',
              effect: 'heartbeat',
              text: {
                ckb: 'هەناسەی سێلین دەلەرزێت و چیدیکە پاشەکشە ناکات؛ ناوچەوانی دەنووسێنێت بە شانتەوە لە ناو هەڵمە گەرمەکەدا: «شێتیت... بەڕاستی شێتم دەکەیت. دەستم بگرە و مەهێڵە سەرمام بێت.»',
                en: 'Her breath trembles—and instead of pulling away, she rests her damp forehead against your shoulder in the steam: “You drive me crazy… hold me close then.”',
              },
            },
          ],
        },
        {
          id: 'celine_spa_tender',
          style: 'tender',
          text: { ckb: '💖 خاولییەکی وشکی بچووک بدە دەستی و قژە تەڕەکەی بۆ وشک بکەرەوە', en: '💖 Gently dry her damp silver hair with a soft warm towel' },
          affectionDelta: 14,
          desireDelta: 15,
          trustDelta: 11,
          followUpBeats: [
            {
              speaker: 'celine',
              image: '/assets/celine_spa.jpg',
              camera: 'close',
              effect: 'warm_glow',
              text: {
                ckb: 'سێلین بە هێواشی چاوە بنەوشەییەکانی دادەخات کاتێک پەنجەکانت بە قژیدا دەهێنیت: «ڕێک وەک شەوەکانی پاریس... کەس وەک تۆ نەیدەزانی چۆن دڵم ئارام بکاتەوە.»',
                en: 'She closes her violet eyes softly under your touch: “Just like Paris… nobody ever touched me as gently as you.”',
              },
            },
          ],
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
            ckb: 'لە گۆشە تاریکەکەی پشت شوشە باراناوییەکەدا، سێلین بە عەزیی کۆرسێتی ڕەشەوە چاوەڕێت دەکات و یەخەی چاکەتەکەت ڕادەکێشێت: «لێرە کەس ناتوانێت بمانبینێت.»',
            en: 'Behind the rain-misted ferns, Celine waits in her black corset dress, pulling you close: “Nobody can see us back here…”',
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
            ckb: 'لەیلا دەرگای ژووری پشت شانۆت لێ دەکاتەوە بە بیکینییە سەوزەکە و زنجیرە زێڕینەکەی کەمەریەوە! «وەرە قفڵی ئەم زنجیرەیەم بۆ ببەستە پێش ئەوەی سەربکەوین بۆ سەربان...»',
            en: 'Layla lets you in dressed in her emerald bikini and gold waist chain: “Come fasten this chain for me…”',
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
            ckb: 'کارمەندی شەوانەی لۆبی بە چرپە پێت دەڵێت: «ئاسانسۆرە زێڕینەکە دەتباتە ژوورە تایبەتەکان و حەمامە هەڵمدارەکانی نهۆمی ١٦ تا ١٨.»',
            en: 'The concierge whispers: “The private elevator unlocks every private suite, marble bath, and rooftop jacuzzi.”',
          },
        },
      ],
    },
  },
];
