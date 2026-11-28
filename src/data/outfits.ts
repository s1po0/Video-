import { HeroineId, LocalizedText } from '../types/game';

export interface OutfitOption {
  id: string;
  heroine: HeroineId;
  name: LocalizedText;
  tag: LocalizedText;
  image: string;
  aiDesc: string;
}

export const SIPAN_OUTFITS = [
  {
    id: 'sipan_penthouse',
    name: { ckb: 'قاتی ڕەشی پێنتهاوس — سیپان', en: 'Sipan — Penthouse Noir Suit' },
    tag: { ckb: '👑 VIP ١٧٠٩', en: '👑 VIP 1709' },
    image: '/assets/sipan_penthouse.jpg',
  },
  {
    id: 'sipan_pool',
    name: { ckb: 'کراسی ئاوریشمی زێڕینی سەربان — سیپان', en: 'Sipan — Rooftop Gold Silk' },
    tag: { ckb: '🌊 سەربان', en: '🌊 Rooftop' },
    image: '/assets/sipan_pool.jpg',
  },
];

export const HEROINE_OUTFITS: Record<HeroineId, OutfitOption[]> = {
  layla: [
    {
      id: 'layla_spa',
      heroine: 'layla',
      name: { ckb: 'بانیۆی کەف و گوڵەباخ', en: 'Rose-Petal Bubble Bath' },
      tag: { ckb: '🌫️ هەڵم و کەف', en: '🌫️ Steamy Bath' },
      image: '/assets/layla_spa.jpg',
      aiDesc: 'soaking in a candlelit marble bubble bath veiled in thick white foam, rose petals, and warm steam clouds',
    },
    {
      id: 'layla_crimson',
      heroine: 'layla',
      name: { ckb: 'ئاوریشمی سووری ژووری خەو', en: 'Crimson Silk Slip & Robe' },
      tag: { ckb: '🔥 زۆر گەرم', en: '🔥 Hot Silk' },
      image: '/assets/layla_crimson.jpg',
      aiDesc: 'wearing a fitted crimson satin lace-trimmed nightgown with a dark velvet robe slipping off one shoulder',
    },
    {
      id: 'layla_swim',
      heroine: 'layla',
      name: { ckb: 'بیکینیی سەوزی سەربان', en: 'Emerald Rooftop Bikini' },
      tag: { ckb: '🌊 مەلەوانگە', en: '🌊 Poolside' },
      image: '/assets/layla_swim.jpg',
      aiDesc: 'wearing an emerald two-piece bikini with a delicate gold waist chain and sheer black sarong by the heated rooftop pool',
    },
    {
      id: 'layla_blush',
      heroine: 'layla',
      name: { ckb: 'مەخمەلی شەوانەی نزیک', en: 'Candlelit Emerald Gown' },
      tag: { ckb: '💋 ڕۆمانسی', en: '💋 Intimate' },
      image: '/assets/layla_blush.jpg',
      aiDesc: 'wearing a low-cut emerald velvet evening gown with flushed cheeks in warm candlelight',
    },
    {
      id: 'layla_normal',
      heroine: 'layla',
      name: { ckb: 'عەزیی شانۆی جاز', en: 'Classic Velvet Stage Dress' },
      tag: { ckb: '🎵 کلاسیک', en: '🎵 Stage' },
      image: '/assets/layla_normal.jpg',
      aiDesc: 'wearing her signature emerald velvet jazz evening dress',
    },
  ],
  celine: [
    {
      id: 'celine_spa',
      heroine: 'celine',
      name: { ckb: 'خاولی و شوشەی تەمگرتوو', en: 'Steamy Shower Towel' },
      tag: { ckb: '🌫️ هەڵم و شوشە', en: '🌫️ Frosted Steam' },
      image: '/assets/celine_spa.jpg',
      aiDesc: 'behind misty frosted shower glass wrapped tightly in a white spa towel amid swirling warm steam',
    },
    {
      id: 'celine_dress',
      heroine: 'celine',
      name: { ckb: 'کۆرسێتی ڕەشی نیوەشەو', en: 'Black Sweetheart Corset Mini' },
      tag: { ckb: '🔥 زۆر گەرم', en: '🔥 Hot Corset' },
      image: '/assets/celine_dress.jpg',
      aiDesc: 'wearing a form-fitting black satin sweetheart corset mini dress with a sheer silk wrap',
    },
    {
      id: 'celine_silk',
      heroine: 'celine',
      name: { ckb: 'جلی خەوی ئاوریشمی سپی', en: 'Pearl Silk Nightwear' },
      tag: { ckb: '🌙 ژووری خەو', en: '🌙 Bedroom' },
      image: '/assets/celine_silk.jpg',
      aiDesc: 'wearing a delicate pearl-white lace-trimmed silk camisole nightwear set with a dark satin robe loose on her arms',
    },
    {
      id: 'celine_blush',
      heroine: 'celine',
      name: { ckb: 'بەردەم ئاگردان', en: 'Fireside Evening Look' },
      tag: { ckb: '💋 ڕۆمانسی', en: '💋 Intimate' },
      image: '/assets/celine_blush.jpg',
      aiDesc: 'flushed warmly by the firelight in a fitted evening silhouette',
    },
    {
      id: 'celine_normal',
      heroine: 'celine',
      name: { ckb: 'ستایلی پاریسی', en: 'Burgundy Noir Suit' },
      tag: { ckb: '🕵️‍♀️ کلاسیک', en: '🕵️‍♀️ Classic' },
      image: '/assets/celine_normal.jpg',
      aiDesc: 'wearing her tailored burgundy investigator blazer',
    },
  ],
  aria: [
    {
      id: 'aria_spa',
      heroine: 'aria',
      name: { ckb: 'جاکوزیی هەڵمداری سەربان', en: 'Rooftop Foam Jacuzzi' },
      tag: { ckb: '🌫️ جاکوزیی گەرم', en: '🌫️ Hot Jacuzzi' },
      image: '/assets/aria_spa.jpg',
      aiDesc: 'soaking in the steaming outdoor rooftop jacuzzi covered in thick white bubble foam under starry skies',
    },
    {
      id: 'aria_swim',
      heroine: 'aria',
      name: { ckb: 'بیکینیی ڕەش و زێڕینی سەربان', en: 'Black & Gold Pool Bikini' },
      tag: { ckb: '🔥 زۆر گەرم', en: '🔥 Hot Bikini' },
      image: '/assets/aria_swim.jpg',
      aiDesc: 'wearing a glamorous black-and-gold bikini with an open sheer silk kimono waist-deep in the steaming rooftop pool',
    },
    {
      id: 'aria_ruby',
      heroine: 'aria',
      name: { ckb: 'عەزیی شەرابیی کەپری تایبەت', en: 'Wine-Red Lace Cabana Dress' },
      tag: { ckb: '💋 کەپری شەو', en: '💋 Cabana' },
      image: '/assets/aria_ruby.jpg',
      aiDesc: 'wearing an off-shoulder wine-red satin mini dress with black lace trim on plush velvet cushions',
    },
    {
      id: 'aria_blush',
      heroine: 'aria',
      name: { ckb: 'گەرمیی ناو هەڵم', en: 'Misty Cabana Glow' },
      tag: { ckb: '✨ نزیک', en: '✨ Close-Up' },
      image: '/assets/aria_blush.jpg',
      aiDesc: 'glowing warmly in golden silk inside the misty poolside cabana',
    },
    {
      id: 'aria_normal',
      heroine: 'aria',
      name: { ckb: 'عەزیی زێڕینی میوانداری', en: 'Gold Silk Hostess Dress' },
      tag: { ckb: '🥂 کلاسیک', en: '🥂 Hostess' },
      image: '/assets/aria_normal.jpg',
      aiDesc: 'wearing her sleek black-and-gold silk cocktail dress',
    },
  ],
};
