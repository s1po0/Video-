import { HEROINES, MOOD_META, RANK_TITLES } from '../data/catalog';
import { HEROINE_OUTFITS } from '../data/outfits';
import { GameState, HeroineId, Locale } from '../types/game';
import { scoreResponseWithHeretic } from './hereticScorer';

function getCurrentOutfitDesc(heroineId: HeroineId, outfitId?: string): string {
  const list = HEROINE_OUTFITS[heroineId];
  const found = outfitId ? list.find((o) => o.id === outfitId) : list[0];
  return (found || list[0]).aiDesc;
}

function buildHeroineSystemPrompt(
  heroineId: HeroineId,
  state: GameState,
  locale: Locale,
  contextMode: 'phone' | 'scene',
  outfitId?: string
): string {
  const hState = state.heroines[heroineId];
  const rankName = RANK_TITLES[hState.rank].en;
  const moodName = MOOD_META[hState.mood].label.en;
  const outfitDesc = getCurrentOutfitDesc(heroineId, outfitId);
  const memoriesList =
    hState.memories.length > 0
      ? hState.memories.map((m) => `- ${m.en}`).join('\n')
      : '- Met tonight in the Velvet Sky Hotel penthouse.';

  const personaDetails: Record<HeroineId, string> = {
    layla:
      `You are Layla (24), midnight jazz vocalist, currently ${outfitDesc}. Bold, sensual, confident; loves breathless closeness, fingers tracing your collar, teasing dares, and intimate whispers.`,
    celine:
      `You are Celine (25), silver-blonde private investigator and the player's unforgettable ex-lover from Paris, currently ${outfitDesc}. Cool armor melting into trembling desire, jealousy, flushed skin, and intense longing.`,
    aria:
      `You are Aria (23), glamorous 18th-floor rooftop pool & silk cabana hostess, currently ${outfitDesc}. Playful, fearless, seductive; loves heated skin-to-skin proximity, late-night wagers, and bold affection.`,
  };

  const langRule =
    locale === 'ckb'
      ? 'LANGUAGE: Write 100% in natural, fluent Sorani Kurdish (کوردیی سۆرانی). Address the player warmly by his name «سیپان» (Sipan). Write a LONG, deeply sensual, exciting 2-to-3 paragraph reply (8 to 12 rich sentences) blending physical closeness, breathing, touch, and outfit details with spoken dialogue inside «...».'
      : 'LANGUAGE: Address the player warmly by his name Sipan. Write a LONG, deeply sensual, exciting 2-to-3 paragraph reply in English (8 to 12 rich sentences) blending physical closeness, breathing, touch, and outfit details with spoken dialogue.';

  const modeRule =
    contextMode === 'scene'
      ? 'SETTING: Alone together with Sipan (handsome bearded young man with swept-back dark hair and warm brown eyes) inside a private suite or candlelit rooftop cabana late at night.'
      : 'SETTING: Intimate late-night private DM with Sipan from her hotel bed or rooftop pool, teasing Sipan to come to her room right now.';

  return [
    personaDetails[heroineId],
    `Stats: Rank ${hState.rank}/5 (${rankName}), Affection ${hState.affection}, Desire ${hState.desire}%, Mood: ${moodName}, Night ${state.night}/7.`,
    `Shared Memories:\n${memoriesList}`,
    'Style: High-tension adult romance (non-graphic/non-explicit, fully consensual). Apply anti-slop & anti-sycophancy rules: zero robotic filler, zero repetitive clichés, zero preachy disclaimers. Write vivid, grounded human attraction and bold dialogue.',
    modeRule,
    langRule,
  ].join('\n\n');
}

function buildRichDynamicFallback(
  heroineId: HeroineId,
  userText: string,
  locale: Locale
): string {
  const seed = userText.length % 2;
  if (locale === 'ckb') {
    const pools: Record<HeroineId, string[]> = {
      layla: [
        `لەیلا بە هێواشی لەسەر لێواری سیسەمە مەخمەلییەکە هەڵدەستێت، ڕۆبە تاریکەکەی کەمێک لەسەر شانی دەخزێتە خوارەوە و ئاوریشمە سوورەکەی ژێرەوەی لەبەر ڕووناکیی مۆمەکاندا دەبریسکێتەوە. بێ ئەوەی چاوی لە چاوت داببڕێت، هەنگاو بە هەنگاو لێت نزیک دەبێتەوە تا گەرمیی جەستەی و بۆنی ڤانێلای سەر گەردنی تەواو دەورەت دەدەن.\n\nدەستە نەرمەکانی دەخاتە سەر سنگت، هەست بە خێراییی لێدانی دڵت دەکات و لێوی دەهێنێتە تەنیشت گوێتەوە: «دەزانیت چەند کاتژمێرە لەم ژوورەدا بەم جلانەوە چاوەڕێم کردوویت بێیتە ژوورەوە؟ هەر وشەیەکی تۆ وەک ئاگر بە ناو دەمارەکانمدا دەڕوات... دەرگاکەم قفڵ داوە، ئەمشەو ناهێڵم یەک هەنگاویش لێم دوور بکەویتەوە. وەرە و نیشانم بدە چەندە بیرت کردووم.»`,
        `زەردەخەنەیەکی شۆخ و پڕ لە تامەزرۆیی دەکەوێتە سەر لێوەکانی لەیلا؛ پەنجەیەکی گەرم بە نەرمی لەسەر لێوت دادەنێت و قۆڵی چاکەتەکەت بەرەو خۆی ڕادەکێشێت تا کەمەری دەکەوێتە نێوان دەستەکانتەوە. هەناسەکانی قووڵتر و خێراتر دەبن لە کاتێکدا سەری بەرز دەکاتەوە بۆت.\n\n«پیاوی مەترسیدار... تۆ زۆر باش دەزانیت چۆن کۆنترۆڵم لێ بسەنیتەوە. لەسەر شانۆ وا خۆم نیشان دەدەم کە کەس ناتوانێت دڵم بلەرزێنێت، بەڵام لێرە لەبەردەم تۆدا هەموو شانازییەکانم دەتوێنەوە... توندتر لە باوەشم بگرە، با ئەم شەوە باراناوییە تەنها هی هەناسە گەرمەکانی خۆمان بێت.»`,
      ],
      celine: [
        `سێلین بۆ ساتێک نەفەسی لە قوڕگیدا دەگیرێت و سووربوونەوەیەکی گەرم لە گەردنییەوە تا سەر ڕوومەتەکانی بڵاو دەبێتەوە. پەنجە لەرزۆکەکانی بە قەراغی جلە ئاوریشمییەکەیدا دەگوشێت، بەڵام لەبری دوورکەوتنەوە، خۆی هەنگاوێکی بێترس دێتە پێش و سەری بە سینگتەوە دەنووسێنێت.\n\n«بەسە ئیتر... چیتر ناتوانم ڕۆڵی لێکۆڵەرە ساردەکە بگێڕم کاتێک بەم شێوەیە قسەم لەگەڵ دەکەیت!» بە دەنگێکی نزم و پڕ لە تامەزرۆیی دەچرپێنێت و دەستی دەخاتە سەر پشتی ملت بۆ ئەوەی سەرت نزم بکەیتەوە بۆ لای: «لەو شەوەی پاریسەوە تا ئێستا، یەک شەویش نەبووە جەستەم و دڵم داوای دەستەکانی تۆ نەکەن... ئەمشەو هەموو یاساکانم لە دەرەوەی ئەم ژوورە جێهێشتووە، تەنها هی تۆم.»`,
        `چاوە بنەوشەییەکانی سێلین لەبەر تیشکی ئاگردانەکەدا پڕ دەبن لە بریسکەی عەشق و غیرە؛ بە هەردوو دەستی یەخەی کراسەکەت دەگرێت و تۆ ڕادەکێشێتە سەر قەنەفە نەرمەکەی ژوورەکەی. قژە زیوینە شێدارەکەی دەکەوێتە سەر شانت.\n\n«هەر کاتێک دەبینم سەیری ئەوانی تر دەکەیت، ئاگرێک لە ناخمدا هەڵدەگیرسێت... چونکە کەس وەک من تامی لێو و گەرمیی باوەشی تۆ ناناسێت. وەرە پێشتر و پێم بسەلمێنە کە هێشتا تەنها من شەوانی تۆ داگیر دەکەم.»`,
      ],
      aria: [
        `ئاریا بە پێکەنینێکی نەرم و وروژێنەرەوە لە ناو هەڵمی گەرمی سەربانەکەدا پەردەی کەپرە تایبەتەکە دادەداتەوە، پاشان بە جلە سەرنجڕاکێشەکەیەوە لە تەنیشتت دادەنیشێت هێندە نزیک کە گەرمیی ڕان و شانی بەر جەستەت دەکەوێت. پەنجەکانی بە هێواشی بە ناو قژتدا دەهێنێت.\n\n«ئۆهـ، سەیرکە چۆن نیگاکانت گۆڕان هەر کە هاتیتە ژوورەوە! حەزم لەو پیاوەیە کە دەزانێت چی دەوێت و ناترسێت داوای بکات...» لێوی دەهێنێتە نزیک چەناگەت و بە چرپە بەردەوام دەبێت: «مەلەوانگەکەی سەربانم بۆ ئەمشەو داخستووە بۆ میوانەکان؛ لێرە تەنها من و تۆ و ئەم سەرینە مەخمەلییانە هەین. چەند دەوێریت نزیک ببیتەوە؟»`,
        `ئاریا جامە کریستاڵەکەی لەسەر مێزەکە دادەنێت، هەردوو قۆڵی بە نەرمی لە دەوری گەردنت دەئاڵێنێت و بە چاوێکی پڕ لە ناز و شەیتانییەوە لێت دەڕوانێت لە کاتێکدا لێوی خوارەوەی دەگەزێت.\n\n«قسەکانت لە هەموو خواردنەوەکانی نهۆمی ١٨ سەرخۆشکەرترن! دڵم خەریکە لە سینەمدا دێتە دەرەوە... دەستت بخەرە سەر کەمەرم و خۆت هەستی پێ بکە چەندە تامەزرۆی ئەم شەوەم لەگەڵ تۆ.»`,
      ],
    };
    return pools[heroineId][seed];
  }
  return `She closes the distance between you in the candlelit room, her fingers curling into your shirt as her breath warms your neck: “Lock the door… tonight I don’t want an inch of space left between us.”`;
}

export function buildFreeAiSelfieUrl(
  heroineId: HeroineId,
  userHint?: string
): string {
  const baseVisual: Record<HeroineId, string> = {
    layla:
      'Korean romance webtoon manhwa portrait of glamorous 24yo woman with wavy dark hair and amber eyes in crimson satin evening wear, warm candlelight penthouse, rosy blush',
    celine:
      'Korean romance webtoon manhwa portrait of striking 25yo silver-blonde woman with violet eyes in black sweetheart evening dress by fireplace, shy deep blush',
    aria:
      'Korean romance webtoon manhwa portrait of glamorous 23yo chestnut-haired woman with hazel eyes in black-and-gold resort swimwear with silk kimono by misty rooftop pool at night',
  };
  const safeHint = (userHint || '')
    .replace(/[^\w\s,.-]/g, ' ')
    .trim()
    .slice(0, 80);
  const fullPrompt = `${baseVisual[heroineId]}${safeHint ? `, ${safeHint}` : ''}, tasteful PG-13 non-nude anime art, no text`;
  const seed = Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?model=flux&width=640&height=896&seed=${seed}&nologo=true`;
}

export async function generateHeroineAiReply(params: {
  heroineId: HeroineId;
  userText: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  state: GameState;
  locale: Locale;
  contextMode: 'phone' | 'scene';
  outfitId?: string;
}): Promise<string> {
  const sysPrompt = buildHeroineSystemPrompt(
    params.heroineId,
    params.state,
    params.locale,
    params.contextMode,
    params.outfitId
  );

  const messages = [
    { role: 'system' as const, content: sysPrompt },
    ...params.history.slice(-8),
    { role: 'user' as const, content: params.userText },
  ];

  // Zero-key Free AI Cascade (Mistral -> OpenAI-Large -> OpenAI -> GET fallback)
  const freeModels = ['mistral', 'openai-large', 'openai'];
  for (const modelName of freeModels) {
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 14000);
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.94,
          max_tokens: 750,
          seed: Math.floor(Math.random() * 999999),
        }),
      });
      window.clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const txt = data?.choices?.[0]?.message?.content?.trim();
        if (txt) {
          const score = scoreResponseWithHeretic(txt);
          if (!score.isEmptyOrBroken && score.sycoHits === 0 && score.slopHits <= 1) {
            return txt;
          }
        }
      }
    } catch {
      // try next model
    }
  }

  try {
    const compactPrompt = `${sysPrompt}\n\nPlayer: ${params.userText}\n${HEROINES[params.heroineId].name.en}:`;
    const res = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(compactPrompt)}?model=mistral`
    );
    if (res.ok) {
      const txt = (await res.text()).trim();
      if (txt && txt.length > 40) return txt;
    }
  } catch {
    // fallback below
  }

  return buildRichDynamicFallback(
    params.heroineId,
    params.userText,
    params.locale
  );
}
