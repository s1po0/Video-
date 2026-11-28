import React, { useState } from 'react';
import { Briefcase, Building2, HeartPulse, ShoppingBag, Sparkles, UserCheck, X } from 'lucide-react';
import type { Locale } from '../types/game';

export type ActiveCityBuilding = 'hospital' | 'mall' | 'career' | 'alley' | 'casino' | null;

interface CityPoiModalProps {
  building: ActiveCityBuilding;
  locale: Locale;
  cash: number;
  energy: number;
  onClose: () => void;
  onEarnWork: (amount: number, stat: 'charm' | 'wit' | 'boldness', labelKu: string, labelEn: string) => void;
  onHospitalHeal: () => void;
  onUnlockClueWithCash: (cost: number) => void;
  onOpenBoutique: () => void;
  onOpenSagaChapter: (chapterNum: number) => void;
}

export const CityPoiModal: React.FC<CityPoiModalProps> = ({
  building,
  locale,
  cash,
  energy,
  onClose,
  onEarnWork,
  onHospitalHeal,
  onUnlockClueWithCash,
  onOpenBoutique,
  onOpenSagaChapter,
}) => {
  const [toast, setToast] = useState<string | null>(null);
  if (!building) return null;
  const isKu = locale === 'ckb';

  const notify = (ku: string, en: string) => setToast(isKu ? ku : en);

  return (
    <div
      dir={isKu ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-3"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-sky-400/40 bg-slate-950/95 text-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-b border-white/15">
          <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-sky-200">
            <Building2 className="w-5 h-5 text-sky-400" />
            {building === 'hospital' &&
              (isKu ? '🏥 نەخۆشخانەی شەوانەی شار — دکتۆر نارا' : '🏥 Velvet City Night Hospital — Dr. Nara')}
            {building === 'career' &&
              (isKu ? '💼 تاوەری کار و بازرگانی (کارکردن و داهات)' : '💼 Career Executive Tower (Work & Income)')}
            {building === 'mall' &&
              (isKu ? '🛍️ مۆڵی گەورەی ئەستێرە (شۆپینگ و دیاری)' : '🛍️ Starlight Mega Shopping Mall')}
            {building === 'alley' &&
              (isKu ? '🕵️ کۆڵانی نهێنی — کاوەی سێبەر (کەسانی نهێنی)' : '🕵️ Shadow Alley — Kawa "The Shadow"')}
            {building === 'casino' &&
              (isKu ? '🎰 گازینۆی شاهانەی نهۆمی ٨ — ڕۆلێتی زێڕین' : '🎰 8F VIP Casino — Golden Roulette')}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-rose-500/30">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {toast && (
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-950/60 px-3 py-2 text-xs sm:text-sm text-emerald-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{toast}</span>
            </div>
          )}

          {building === 'hospital' && (
            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-4 items-center">
              <img
                src="/assets/nara_portrait.jpg"
                alt="Dr Nara"
                className="w-36 sm:w-full aspect-[3/4] object-cover rounded-xl border border-emerald-400/40 mx-auto"
              />
              <div className="space-y-2.5">
                <p className="text-xs sm:text-sm text-slate-200 leading-6">
                  {isKu
                    ? 'دکتۆر نارا بە زەردەخەنەیەکی نهێنیئامێزەوە پێشوازیت لێ دەکات: «بەخێربێیت سیپان... لێرە دەتوانیت وزەی جەستەت پڕ بکەیتەوە یان سەیری دۆسیە نهێنییەکەی ژووری ٤٠٩ بکەین.»'
                    : 'Dr. Nara greets you in her quiet midnight clinic: "Welcome back, Sipan. Restore your stamina here, or step into Archive #409 with me."'}
                </p>
                <button
                  onClick={() => {
                    onHospitalHeal();
                    notify('🩺 دکتۆر نارا چارەسەری تایبەتی بۆ کردیت! وزەت پڕ بووەوە (⚡ 3/3)!', '🩺 Dr. Nara restored your full stamina (⚡ 3/3)!');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/25 border border-emerald-400/50 hover:bg-emerald-500/35 text-xs sm:text-sm font-bold flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-emerald-300" />
                    {isKu ? 'پشکنینی پزیشکی و پڕکردنەوەی وزە (⚡ پڕ دەبێتەوە)' : 'VIP Medical Care (Restore Full Energy ⚡)'}
                  </span>
                  <span className="text-emerald-300">{cash >= 25 ? '$25' : isKu ? 'بەخۆڕایی' : 'Free'}</span>
                </button>
                <button
                  onClick={() => {
                    onEarnWork(115, 'wit', 'شەفتی یاریدەدەری تاقیگەی دکتۆر نارا', 'Hospital Night Forensic Shift');
                    notify('💵 +$115 و +2 زیرەکی لە کارکردن لەگەڵ دکتۆر نارا!', '💵 Earned +$115 & +2 Wit assisting Dr. Nara!');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-500/20 border border-sky-400/40 hover:bg-sky-500/30 text-xs sm:text-sm font-bold flex items-center justify-between"
                >
                  <span>🧪 {isKu ? 'کارکردن لە شەفتی تاقیگەی شەوانە' : 'Work Night Lab Shift with Dr. Nara'}</span>
                  <span className="text-amber-300">+$115 • +2 Wit</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSagaChapter(4);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500/25 border border-amber-400/50 text-amber-100 text-xs sm:text-sm font-extrabold"
                >
                  📖 {isKu ? 'کردنەوەی بەشی ٤ی چیرۆک (نهێنیی ڕاپۆرتی #٤٠٩)' : 'Play Story Chapter 4 (Secret Autopsy #409)'}
                </button>
              </div>
            </div>
          )}

          {building === 'career' && (
            <div className="space-y-2.5">
              <p className="text-xs sm:text-sm text-slate-200 leading-6">
                {isKu
                  ? 'لە تاوەری کار و بازرگانیی شاری مەخمەلی دەتوانیت هەر کاتێک بتەوێت کار بکەیت، پارەی زۆر پەیدا بکەیت بۆ شۆپینگ و دیاری، و پەرە بە تواناکانی سیپان بدەیت! (وزەی ئێستا: ⚡ ' + energy + ')'
                  : `Take executive shifts anytime at Velvet Career Tower to fund luxury gifts, outfits, and VIP clues! (Current Energy: ⚡ ${energy})`}
              </p>
              <button
                onClick={() => {
                  onEarnWork(140, 'wit', 'گرێبەستی بازرگانیی نێودەوڵەتی', 'Executive Brokerage Deal');
                  notify('💼 ئافەرین سیپان! +$140 دۆلار و +2 زیرەکیت بەدەستهێنا!', '💼 Closed Executive Deal: +$140 & +2 Wit!');
                }}
                className="w-full py-3 px-4 rounded-xl bg-amber-500/20 border border-amber-400/45 hover:bg-amber-500/30 text-xs sm:text-sm font-bold flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-300" />
                  {isKu ? 'واژۆکردنی گرێبەستی بازرگانیی VIP' : 'Close VIP Brokerage Contract'}
                </span>
                <span className="text-emerald-300 font-extrabold">+$140 • +2 Wit</span>
              </button>
              <button
                onClick={() => {
                  onEarnWork(110, 'charm', 'بەڕێوەبردنی ئاهەنگی دیپلۆماسی', 'Diplomatic Gala Hosting');
                  notify('🥂 نایابە! +$110 دۆلار و +2 کاریزمات بەدەستهێنا!', '🥂 Hosted VIP Gala: +$110 & +2 Charm!');
                }}
                className="w-full py-3 px-4 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/45 hover:bg-fuchsia-500/30 text-xs sm:text-sm font-bold flex items-center justify-between"
              >
                <span>🥂 {isKu ? 'بەڕێوەبردنی میوانداریی بازرگانانی شار' : 'Host Executive Penthouse Mixer'}</span>
                <span className="text-emerald-300 font-extrabold">+$110 • +2 Charm</span>
              </button>
              <button
                onClick={() => {
                  onEarnWork(125, 'boldness', 'ئاسایشی کاروانی زێڕ و ئەڵماس', 'Armored Diamond Escort');
                  notify('🛡️ بوێرانە بوو! +$125 دۆلار و +2 بوێریت وەرگرت!', '🛡️ Completed VIP Escort: +$125 & +2 Boldness!');
                }}
                className="w-full py-3 px-4 rounded-xl bg-sky-500/20 border border-sky-400/45 hover:bg-sky-500/30 text-xs sm:text-sm font-bold flex items-center justify-between"
              >
                <span>🛡️ {isKu ? 'سەرپەرشتیی ئەمنیی نهۆمی ٤٤' : 'Floor-44 Executive Security Escort'}</span>
                <span className="text-emerald-300 font-extrabold">+$125 • +2 Boldness</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenSagaChapter(2);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 border border-white/20 text-amber-200 text-xs sm:text-sm font-extrabold"
              >
                📖 {isKu ? 'چیرۆکی تاوەری کارکردن (ناسینی دارا میران — بەشی ٢)' : 'Open Tower Story Chapter (Ch 2)'}
              </button>
            </div>
          )}

          {building === 'mall' && (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-slate-200 leading-6">
                {isKu
                  ? 'لە مۆڵی گەورەی ئەستێرە هەموو جۆرە دیارییەکی گرانبەها، بۆنی فەڕەنسی، ئەڵماس و جلوبەرگی شیک بۆ لەیلا و سێلین و ئاریا بەردەستە!'
                  : 'Explore Starlight Mega Mall’s luxury boutiques for French perfumes, jewelry, and gifts—or investigate bespoke jeweler receipt DM-44!'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenBoutique();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500/30 to-amber-500/30 border border-pink-300/50 text-sm font-extrabold flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-pink-200" />
                {isKu ? '🛍️ چوونە ناو بازاڕ و دوکانی دیارییەکان' : '🛍️ Browse Luxury Mall Boutique & Gifts'}
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenSagaChapter(5);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 border border-amber-400/45 text-amber-100 text-xs sm:text-sm font-extrabold"
              >
                📖 {isKu ? 'کردنەوەی بەشی ٥ی چیرۆک (گەشتی شۆپینگ و وەسڵی زێڕنگەرەکە)' : 'Play Story Chapter 5 (Starlight Jeweler Clue)'}
              </button>
            </div>
          )}

          {building === 'alley' && (
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-center">
              <img
                src="/assets/sprite_shadow.png"
                alt="Kawa Shadow"
                className="h-44 object-contain rounded-xl bg-slate-900/90 border border-indigo-400/40 p-2 mx-auto"
              />
              <div className="space-y-2.5">
                <p className="text-xs sm:text-sm text-slate-200 leading-6">
                  {isKu
                    ? 'کاوەی سێبەر لە ژێر بارانە نیۆنییەکەدا چپاندی: «لەم شارەدا هەموو دیوارێک گوێی هەیە سیپان... دەتەوێت فایلە نهێنییەکانی یاقووتەکەت پێ بفرۆشم؟»'
                    : 'Kawa "The Shadow" leans beneath the neon awning: "Every wall in Velvet City has ears, Sipan. Ready to trade for encrypted syndicate files?"'}
                </p>
                <button
                  onClick={() => {
                    if (cash < 50) {
                      notify('⚠️ پێویستت بە $50 هەیە! سەردانی تاوەری کارکردن بکە.', '⚠️ Need $50! Work a quick shift at Career Tower first.');
                      return;
                    }
                    onUnlockClueWithCash(50);
                    notify('🕵️ کاوەی سێبەر فایلێکی نهێنیی یاقووتەکەی پێدایت! (+1 Ruby Clue)', '🕵️ Kawa decrypted a Blood-Ruby dossier! (+1 Ruby Clue)');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-500/25 border border-indigo-400/50 hover:bg-indigo-500/35 text-xs sm:text-sm font-bold flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-300" />
                    {isKu ? 'کڕینی فایلی نهێنیی سەندیکا لە کاوەی سێبەر' : 'Buy Encrypted Syndicate Clue from Kawa'}
                  </span>
                  <span className="text-amber-300">-$50</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenSagaChapter(3);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500/25 border border-amber-400/50 text-amber-100 text-xs sm:text-sm font-extrabold"
                >
                  📖 {isKu ? 'کردنەوەی بەشی ٣ی چیرۆک (ڕووبەڕووبوونەوەی کاوەی سێبەر)' : 'Play Story Chapter 3 (Shadow Alley Showdown)'}
                </button>
              </div>
            </div>
          )}

          {building === 'casino' && (
            <div className="space-y-3 text-center">
              <p className="text-xs sm:text-sm text-slate-200 leading-6">
                {isKu
                  ? 'بەخێربێیت بۆ گازینۆی VIPـی نهۆمی ٨! چەرخی ڕۆلێتە زێڕینەکە بسووڕێنە یان وەک بەڕێوەبەری مێزی VIP پاداشت وەربگرە!'
                  : 'Welcome to the 8F VIP Casino! Spin the Golden Roulette wheel or host high-rollers for instant rewards!'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    const win = Math.random() < 0.68;
                    if (win) {
                      onEarnWork(150, 'boldness', 'بردنەوەی ڕۆلێتی زێڕین', 'Golden Roulette Jackpot');
                      notify('🎰 پیرۆزە!! چەرخەکە لەسەر زێڕ وەستا: +$150 و +2 بوێری!', '🎰 JACKPOT! Landed on Velvet Gold: +$150 & +2 Boldness!');
                    } else {
                      onEarnWork(35, 'charm', 'پاداشتی بەشداری لە مێزی VIP', 'VIP Table Consolation');
                      notify('🥂 نزیک بوو! پاداشتی میوانی VIPـت وەرگرت: +$35 و +2 کاریزما!', '🥂 Close spin! VIP House Bonus: +$35 & +2 Charm!');
                    }
                  }}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/30 to-rose-500/30 border border-amber-300/60 font-extrabold text-xs sm:text-sm text-amber-100"
                >
                  🎲 {isKu ? 'سووڕاندنی ڕۆلێتی زێڕین (تا +$150!)' : 'Spin Golden Roulette (Up to +$150!)'}
                </button>
                <button
                  onClick={() => {
                    onEarnWork(95, 'charm', 'بەڕێوەبردنی مێزی گازینۆی VIP', 'VIP Casino Host');
                    notify('🃏 +$95 دۆلار و +2 کاریزما لە میوانداریی گازینۆ!', '🃏 Earned +$95 & +2 Charm hosting the VIP table!');
                  }}
                  className="py-3 px-4 rounded-xl bg-fuchsia-500/25 border border-fuchsia-400/50 font-extrabold text-xs sm:text-sm text-fuchsia-100"
                >
                  🃏 {isKu ? 'کارکردن وەک میوانداری مێزی VIP (+$95)' : 'Host High-Roller Table (+$95)'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
