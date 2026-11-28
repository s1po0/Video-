import type { HeroineId } from '../types/game';

export type CityPoiId = 'hotel_17f' | 'hotel_18f' | 'city_career' | 'city_alley' | 'city_hospital' | 'city_mall';

export interface StoryClue {
  id: string;
  title: { ku: string; en: string };
  plantedChapter: number;
  payoffChapter: number;
  redHerring?: boolean;
  delayedSignificance?: boolean;
  technique: 'hidden-in-plain-sight' | 'camouflaged' | 'red-herring' | 'forensic-means' | 'misinterpreted' | 'absence-as-clue';
  summary: { ku: string; en: string };
  revealedTruth: { ku: string; en: string };
}

export interface SagaChoice {
  id: string;
  text: { ku: string; en: string };
  nextChapter: number;
  heroine?: HeroineId;
  affectionDelta?: number;
  trustDelta?: number;
  passionDelta?: number;
  moneyDelta?: number;
  statDelta?: { charm?: number; wit?: number; boldness?: number };
  unlockClueId?: string;
  consequenceText: { ku: string; en: string };
}

export interface SagaChapter {
  number: number;
  id: string;
  title: { ku: string; en: string };
  beat: string;
  hook: 'question' | 'cliffhanger' | 'revelation' | 'decision' | 'emotional' | 'reversal' | 'resolution';
  outcome: 'yes-but' | 'no-and' | 'yes' | 'no';
  locationId: CityPoiId;
  locationLabel: { ku: string; en: string };
  portrait: string;
  bg: string;
  speakerName: { ku: string; en: string };
  paragraphs: { ku: string[]; en: string[] };
  sequelDilemma?: { ku: string; en: string };
  plantedClueId?: string;
  debunkedClueId?: string;
  choices: SagaChoice[];
}

export const FAIR_PLAY_CLUES: StoryClue[] = [
  {
    id: 'bitter-almond-oud',
    title: { ku: 'بۆنی بادەمی تاڵ و عوودی شەوانە', en: 'Bitter Almond & Midnight Oud Scent' },
    plantedChapter: 1,
    payoffChapter: 10,
    delayedSignificance: true,
    technique: 'hidden-in-plain-sight',
    summary: {
      ku: 'لەسەر زەرفی ڕەشی ژووری ١٧٠٩ بۆنێکی عوودی تێکەڵ بە بادەمی تاڵ دەهات؛ سیپان وایزانی تەنها بۆنی گرانبەهای هۆتێلەکەیە.',
      en: 'A faint bitter-almond note beneath rare oud clung to Suite 1709’s black envelope—at first mistaken for luxury hotel cologne.',
    },
    revealedTruth: {
      ku: 'ئەو بۆنە دڵۆپی ژەهری سیانیدی پزیشکیی تایبەتە کە تەنها لە تاقیگەی خێرخوازیی تاوەری دارا میران دروست دەکرێت.',
      en: 'That scent is pharmaceutical cyanide-oud tincture compounded exclusively inside Dara Miran’s private foundation lab.',
    },
  },
  {
    id: 'garage-ledger-0214',
    title: { ku: 'تۆماری گەراجی نهۆمی ٤٤ لە کاتژمێر ٠٢:١٤', en: '02:14 AM Executive Garage Ledger' },
    plantedChapter: 2,
    payoffChapter: 10,
    technique: 'camouflaged',
    summary: {
      ku: 'لە نێو ٢٠ دێڕی ژمێریاریی تاوەری کارکردندا، ئۆتۆمبێلی دیپلۆماسیی دارا میران لە شەوی دزینی یاقووتەکە لە گەراجی هۆتێل دەرچووە.',
      en: 'Hidden among twenty routine brokerage entries at Career Tower, Dara Miran’s sedan exited the Hotel garage at 02:14 AM.',
    },
    revealedTruth: {
      ku: 'دارا میران لەو کاتژمێرەدا لە شاری تر نەبووە؛ خۆی لە نهۆمی ١٧ بووە کاتێک خەزێنەکەی لەیلا کرایەوە.',
      en: 'Dara Miran’s out-of-town alibi collapses—he was physically inside 17F when Layla’s safe was opened.',
    },
  },
  {
    id: 'kawa-ruby-clasp',
    title: { ku: 'قوفڵی زێڕینی یاقووتەکە لە گیرفانی کاوەی سێبەر', en: 'Pawned Ruby Clasp in Kawa’s Coat' },
    plantedChapter: 3,
    payoffChapter: 8,
    redHerring: true,
    technique: 'red-herring',
    summary: {
      ku: 'لە کۆڵانی نهێنیدا سێلین قوفڵی شکاوی ملوانکەکەی لەیلا لای کاوەی سێبەر دەدۆزێتەوە و گومان دەکات ئەو دزەکە بێت.',
      en: 'In Shadow Alley, Celine spots the broken gold clasp of Layla’s heirloom in Kawa’s trenchcoat—making Kawa the prime suspect.',
    },
    revealedTruth: {
      ku: 'سەرلێشێواندنی پلان بۆ داڕێژراو (Red Herring): لەیلا خۆی قوفڵە بەتاڵەکەی دابوو بە کاوە تا بکوژە ڕاستەقینەکە نەزانێت مایکرۆچیپەکە دەرهێنراوە!',
      en: 'Cleared in Ch 8: Layla secretly paid Kawa to fence the empty clasp as a decoy after hiding the encrypted microchip!',
    },
  },
  {
    id: 'forged-autopsy-409',
    title: { ku: 'واژۆی ساختەی چەپدەست لە ڕاپۆرتی پزیشکیی #٤٠٩', en: 'Left-Handed Forged Autopsy #409' },
    plantedChapter: 4,
    payoffChapter: 10,
    technique: 'forensic-means',
    summary: {
      ku: 'دکتۆر نارا لە نەخۆشخانەی شەوانە پیشانی سیپانی دەدات کە ڕاپۆرتی مردنی دایکی لەیلا بە قەڵەمی مەرەکەبی چەپدەست واژۆ کراوە.',
      en: 'At the Night Hospital, Dr. Nara proves Layla’s mother’s autopsy was forged with left-handed fountain-pen pressure.',
    },
    revealedTruth: {
      ku: 'ئامرازی تاوان (Means): پرۆفیسۆری کۆچکردوو ڕاستدەست بوو؛ بکوژەکە کەسێکی چەپدەستی دەسەڵاتدارە کە دەستی بە ئەرشیفی نەخۆشخانە گەیشتووە.',
      en: 'Means proven: the late chief pathologist was right-handed; only a left-handed board patron could override Hospital records.',
    },
  },
  {
    id: 'left-handed-cufflink',
    title: { ku: 'وەسڵی قۆپچەی پلاتینی چەپدەست لە مۆڵی ئەستێرە', en: 'Left-Handed Platinum Cufflink Receipt' },
    plantedChapter: 5,
    payoffChapter: 10,
    technique: 'misinterpreted',
    summary: {
      ku: 'لە مۆڵی شۆپینگ سیپان وەسڵێکی زێڕنگەری دەبینێت بۆ قۆپچەی تایبەتی چەپدەست بە نەخشی یاقووت؛ سەرەتا وا دەزانێت هی باڵیۆزێکە.',
      en: 'While shopping at Starlight Mall, Sipan finds a jeweler’s bespoke order for left-handed cufflinks—initially assumed to be a diplomat’s.',
    },
    revealedTruth: {
      ku: 'کۆدی کڕیارەکە DM-44ـە: دارا میران چەپدەستە و هەمان مەرەکەبی شینی ئیمپراتۆری بەکاردەهێنێت.',
      en: 'Client code DM-44 belongs to Dara Miran—confirming his left-handedness and signature ink.',
    },
  },
  {
    id: 'eleven-silent-minutes',
    title: { ku: '١١ خولەک بێدەنگی لە کامێرای نهۆمی ١٨', en: '11 Silent Minutes on 18F Security Feed' },
    plantedChapter: 6,
    payoffChapter: 10,
    technique: 'absence-as-clue',
    summary: {
      ku: 'لە کاتی پرۆڤەی شەوانەی ئاریا لە سەربانی مەلەوانگە، کامێرای تایبەتی سپۆنسەرەکە بۆ ١١ خولەک کوژاوەتەوە بێ هیچ زەنگێکی ئاگادارکردنەوە.',
      en: 'During Aria’s midnight rooftop rehearsal, the patron VIP feed went dark for 11 minutes without triggering hotel security.',
    },
    revealedTruth: {
      ku: 'پاڵنەر و دەرفەت (Motive & Opportunity): تەنها سپۆنسەری سەرەکیی ئاریا — دارا میران — کۆدی بێدەنگکردنی کامێراکەی هەبوو تا مایکرۆچیپەکە بدزێت.',
      en: 'Motive & Opportunity: Only Aria’s patron Dara Miran held the override code—desperate to erase the Hospital embezzlement ledger inside the ruby.',
    },
  },
];
