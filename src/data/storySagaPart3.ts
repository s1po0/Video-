import { FAIR_PLAY_CLUES, type SagaChapter } from './storySagaTypes';
import { SAGA_CHAPTERS_PART1 } from './storySagaPart1';
import { SAGA_CHAPTERS_PART2 } from './storySagaPart2';

export const SAGA_CHAPTERS_PART3: SagaChapter[] = [
  {
    number: 9,
    id: 'chapter-09',
    title: { ku: 'بەشی ٩: ساتی ڕەش لە بەرەبەیاندا (تاقیکردنەوەی دڵ)', en: 'Ch 9: The Black Moment Before Dawn' },
    beat: 'All Is Lost / Romance Black Moment',
    hook: 'emotional',
    outcome: 'no-and',
    locationId: 'hotel_17f',
    locationLabel: { ku: '🏨 هۆتێلی مەخمەلی — ڕاڕەوی نهۆمی ١٧', en: '🏨 Velvet Hotel — 17F Corridor' },
    portrait: '/assets/celine_portrait.jpg',
    bg: '/assets/bg_penthouse.jpg',
    speakerName: { ku: 'لەیلا، سێلین و ئاریا', en: 'Layla, Celine & Aria' },
    paragraphs: {
      ku: [
        'کاتێک گەڕانەوە نهۆمی ١٧ـی هۆتێلەکە، دارا میران بە هێزی یاسایی و پۆلیسی فەرمییەوە ڕاڕەوەکەی داخستبوو! بە زەردەخەنەیەکی ساردەوە کاغەزێکی فەرمیی بەرز کردەوە: سکاڵای تۆمەتبارکردنی سیپان بە دزینی یاقووتەکە و دەستکاریکردنی ئەرشیفی نەخۆشخانە!',
        'خراپتر لەوە، دارا تۆمارێکی کۆنی پێنج ساڵ لەمەوبەری خستە ڕوو تا وا نیشانی لەیلا و سێلین و ئاریا بدات کە سیپان تەنها بۆ پارەی خەڵاتەکە لێیان نزیک بووەتەوە. بۆ چرکەیەک، ترس و گومان کەوتە نێو چاوی هەموویان — ساتی هەرە تاریک کە تێیدا درۆ کۆنەکەی سیپان («کەس تۆی بۆ خۆت ناوێت») خەریک بوو سەردەکەوت.',
        'دارا بە دەنگی بەرز وتی: «سیپان، ئەگەر ئەم شارە بەجێبهێڵیت و بێدەنگ بیت، هەموو تۆمەتەکان دەسڕمەوە و دەوڵەمەندت دەکەم. بڕیار بدە!»',
      ],
      en: [
        'Back on 17F, Dara Miran stood flanked by private counsel, brandishing forged warrants accusing Sipan of the ruby theft and Hospital break-in—while twisting Sipan’s guarded past to convince Layla, Celine, and Aria he only ever wanted a payout.',
        'In that devastating Black Moment, Dara offered Sipan a clean flight out of Velvet City and a fortune in hush money—testing whether Sipan would retreat behind his old lie or risk everything for love and truth.',
      ],
    },
    sequelDilemma: {
      ku: 'دوو ڕێگە لەبەردەم سیپاندایە: هەموو بەڵگە چاندراوەکان لە هۆڵی مەخمەلی کۆبکاتەوە و ڕاستییەکە بتەقێنێتەوە، یان سازش بکات!',
      en: 'Risk arrest to assemble every fair-play clue in the Velvet Lounge, or take Dara’s hush deal?',
    },
    choices: [
      {
        id: 'ch9_choose_truth_and_love',
        text: { ku: 'پێشنیازەکەی دارا بدڕێنە! داوا لە هەمووان بکە لە هۆڵی پیانۆکە کۆببنەوە بۆ ئاشکراکردنی بکوژەکە!', en: 'Tear up Dara’s bribe in front of everyone and summon the Velvet Lounge showdown!' },
        nextChapter: 10,
        heroine: 'layla',
        affectionDelta: 18,
        trustDelta: 22,
        passionDelta: 14,
        statDelta: { boldness: 4, charm: 2 },
        consequenceText: {
          ku: 'سیپان کاغەزەکەی دڕاند! چاوەکانی لەیلا و سێلین و ئاریا بە شانازی و خۆشەویستییەوە درەوشانەوە — کاتی دادگایی ڕاستەقینەیە!',
          en: 'Sipan tore the bribe in half! Doubt vanished from the heroines’ eyes as everyone entered the Velvet Lounge.',
        },
      },
      {
        id: 'ch9_shadow_compromise',
        text: { ku: 'وا نیشان بدە کە ڕازیت بە ڕێککەوتنێکی سێبەری و لە تاریکییەوە یارییەکە بەڕێوە ببە (کۆتایی جێگرەوە)', en: 'Accept a cold shadow truce to rule Velvet City from behind the curtain (Noir Path)' },
        nextChapter: 12,
        moneyDelta: 500,
        statDelta: { wit: 2 },
        consequenceText: {
          ku: 'سیپان ڕێگە سارد و تاریکەکەی هەڵبژارد... پارە و دەسەڵاتی بردەوە، بەڵام بە چ نرخێک؟',
          en: 'Sipan chose power in the shadows—walking toward the bittersweet Noir Finale.',
        },
      },
    ],
  },
  {
    number: 10,
    id: 'chapter-10',
    title: { ku: 'بەشی ١٠: کۆبوونەوەی گومانلێکراوان لە هۆڵی مەخمەلی (لوتکەی ئاشکراکردن)', en: 'Ch 10: Gather the Suspects in Velvet Lounge' },
    beat: 'Climax / Fair-Play Reveal',
    hook: 'reversal',
    outcome: 'yes',
    locationId: 'hotel_17f',
    locationLabel: { ku: '🎹 هۆڵی جاز و پیانۆ — نهۆمی ١٧', en: '🎹 17F Velvet Jazz & Piano Lounge' },
    portrait: '/assets/aria_portrait.jpg',
    bg: '/assets/bg_lounge.jpg',
    speakerName: { ku: 'سیپان، دکتۆر نارا و هەمووان', en: 'Sipan, Dr. Nara & Full Cast' },
    paragraphs: {
      ku: [
        'لە ژێر چلچرا زێڕینەکەی هۆڵی جازدا، لەیلا، سێلین، ئاریا، دکتۆر نارا، کاوەی سێبەر و دارا میران کۆببوونەوە. سیپان لە لای پیانۆ گەورەکەوە وەستا و یەک بە یەک بەڵگە حاشاهەڵنەگرەکانی خستە سەر مێزەکە:',
        '«یەکەم — ئامرازی تاوان (Means): بۆنی بادەمی تاڵ و عوود لەسەر زەرفی ژووری ١٧٠٩ هەمان ژەهری سیانیدی تاقیگەی دارا میرانە کە پێنج ساڵ لەمەوبەر دایکی لەیلای پێ ژەهرخوارد کرا، و دکتۆر نارا سەلماندی کە ڕاپۆرتی #٤٠٩ بە دەستی چەپ ساختە کراوە — ڕێک وەک وەسڵی قۆپچە پلاتینییەکانی DM-44 لە مۆڵی ئەستێرە!»',
        '«دووەم و سێیەم — دەرفەت و پاڵنەر (Opportunity & Motive): تۆماری گەراجی کاتژمێر ٠٢:١٤ دەیسەلمێنێت دارا لە شەوی دزییەکەدا لە هۆتێل بووە، و تەنها سپۆنسەرەکەی ئاریا کۆدی بێدەنگکردنی کامێرای نهۆمی ١٨ـی هەبوو بۆ ١١ خولەک تا فایلی دزیی سندوقی نەخۆشخانەکە بسڕێتەوە!» ئاریا قوفڵی پیانۆکەی کردەوە و مایکرۆچیپەکەی دایە دەستی لێکۆڵەر سێلین؛ کەلەپچەکان لە دەستی دارا میران توند کران!',
      ],
      en: [
        'Under the crystal chandelier of the Velvet Jazz Lounge, Sipan assembled Layla, Celine, Aria, Dr. Nara, Kawa, and Dara Miran—and laid out every planted Fair-Play clue:',
        '1) MEANS: The bitter-almond oud on Suite 1709’s envelope matched Dara’s private cyanide tincture, and Dr. Nara’s File #409 proved a left-handed forger—confirmed by Starlight Mall receipt DM-44!',
        '2) OPPORTUNITY & MOTIVE: The 02:14 AM garage ledger placed Dara’s car inside the hotel, and only Aria’s gala patron held the code for the 11-minute 18F camera blackout to bury his Hospital embezzlement! As Aria pulled the intact microchip from her grand piano, Detective Celine snapped the cuffs onto Dara Miran!',
      ],
    },
    choices: [
      {
        id: 'ch10_to_hea',
        text: { ku: 'بەرەو بەرەبەیانی سەرکەوتن و کۆتایی ڕۆمانسیی شایستە لە سەربانی هۆتێلەکە بڕۆن (+$300 خەڵات)', en: 'Step out into the golden rooftop dawn for your earned Happy Ever After (+$300 Reward)' },
        nextChapter: 11,
        heroine: 'layla',
        affectionDelta: 20,
        trustDelta: 20,
        passionDelta: 20,
        moneyDelta: 300,
        consequenceText: {
          ku: 'تاوانبارەکە کەوت و شاری مەخمەلی ئازاد بوو؛ ئێستا کاتی پاداشتی دڵە!',
          en: 'Justice triumphed across Velvet City—dawn awaits on the 18F Sky Deck!',
        },
      },
    ],
  },
  {
    number: 11,
    id: 'chapter-11',
    title: { ku: 'بەشی ١١ (کۆتایی ڕاستەقینە HEA): خۆرهەڵاتی ئەوین بەسەر شاری مەخمەلیدا', en: 'Ch 11 (True HEA): Golden Dawn Over Velvet City' },
    beat: 'Earned HEA Resolution',
    hook: 'resolution',
    outcome: 'yes',
    locationId: 'hotel_18f',
    locationLabel: { ku: '🌅 سەربانی مەلەوانگەی بێکۆتایی — بەرەبەیان', en: '🌅 18F Infinity Sky Deck — Sunrise' },
    portrait: '/assets/cg_penthouse_date.jpg',
    bg: '/assets/bg_pool.jpg',
    speakerName: { ku: 'کۆتایی زێڕین — سیپان و خۆشەویستانی', en: 'Golden HEA Finale' },
    paragraphs: {
      ku: [
        'تیشکی زێڕینی بەرەبەیان هەورە باراناوییەکانی شاری مەخمەلیی لادا و ئاوی مەلەوانگەی نهۆمی ١٨ وەک ئاوێنەیەکی ئەڵماسی درەوشایەوە. میراتەکەی دایکی لەیلا گەڕایەوە، ناوی سێلین وەک پاڵەوانی دادپەروەری لە هەموو شاردا دەنگی دایەوە، ئاریا بوو بە خاوەنی سەکۆی ئازادی خۆی، و دکتۆر ناراش کرا بە بەڕێوەبەری نوێی نەخۆشخانەی شار.',
        'سیپان چیتر ئەو پیاوە تەنهایە نەبوو کە لە پشت دیوارە ساردەکانەوە خۆی دەشاردەوە. کاتێک دەستی خۆشەویستەکەی لە ناو پەنجەکانیدا توند کرد و بەسەر نەخشە گەورە و ئازادەکەی شار و هۆتێلەکەدا دەیڕوانی، تێگەیشت کە گەورەترین گەنجینەی ئەم حەوت شەوە مەخمەلییە یاقووت نەبوو — بەڵکو دووبارە فێربوونەوەی عەشق و متمانە بوو.',
      ],
      en: [
        'Golden sunrise broke over Velvet City’s skyscrapers, turning the 18F infinity pool into liquid light. Layla’s family honor was restored, Celine cleared her name in triumph, Aria claimed her own stage, and Dr. Nara took the helm of the reformed City Hospital.',
        'Holding his beloved’s hand high above the open city, Sipan knew his old armor was gone forever—the true treasure of Midnight Velvet was a love earned through courage and truth.',
      ],
    },
    choices: [],
  },
  {
    number: 12,
    id: 'chapter-12',
    title: { ku: 'بەشی ١٢ (کۆتایی سێبەری): پاشای بێدەنگی شاری مەخمەلی', en: 'Ch 12 (Noir Alternate Ending): Shadow King of Velvet City' },
    beat: 'Alternate Noir Ending',
    hook: 'resolution',
    outcome: 'yes-but',
    locationId: 'city_alley',
    locationLabel: { ku: '🌃 تاوەری سێبەری شاری مەخمەلی', en: '🌃 Velvet City Shadow Penthouse' },
    portrait: '/assets/sprite_sipan.png',
    bg: '/assets/bg_penthouse.jpg',
    speakerName: { ku: 'سیپان — کۆتایی سێبەر', en: 'Sipan — Noir Finale' },
    paragraphs: {
      ku: [
        'سیپان بە بەڵگە نهێنییەکانەوە دارا میرانی ناچار کرد لە شار هەڵبێت و خۆی دەستی گرت بەسەر تاوەری کار و بازرگانیدا. ئەو ئێستا دەوڵەمەندترین و بەهێزترین پیاوی شاری مەخمەلی بوو، بەڵام هەموو شەوێک کاتێک لە سەربانەوە سەیری ڕووناکییەکانی شاری دەکرد، بیری ئەو دڵە ڕاستگۆیانەی دەکرد کە دەیانتوانی بە ڕاستی خۆشیان بوێت.',
        'تۆ هەمیشە دەتوانیت بگەڕێیتەوە بۆ بەشی ٩ لە پەرتووکی چیرۆکەکەدا و ڕێگەی ڕاستی و عەشق هەڵبژێریت!',
      ],
      en: [
        'Using the leverage in secret, Sipan forced Dara Miran into exile and claimed the top floor of Career Tower for himself—wealthy beyond measure, yet haunted by the love he left behind. (Revisit Chapter 9 anytime in the Saga Reader to claim the True HEA!)',
      ],
    },
    choices: [],
  },
];

export const STORY_SAGA_CHAPTERS: SagaChapter[] = [
  ...SAGA_CHAPTERS_PART1,
  ...SAGA_CHAPTERS_PART2,
  ...SAGA_CHAPTERS_PART3,
];

export { FAIR_PLAY_CLUES };
