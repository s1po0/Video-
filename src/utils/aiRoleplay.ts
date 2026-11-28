import { HEROINES, MOOD_META, RANK_TITLES } from '../data/catalog';
import { GameState, HeroineId, Locale } from '../types/game';

function buildHeroineSystemPrompt(
  heroineId: HeroineId,
  state: GameState,
  locale: Locale,
  contextMode: 'phone' | 'scene'
): string {
  const hState = state.heroines[heroineId];
  const rankName = RANK_TITLES[hState.rank].en;
  const moodName = MOOD_META[hState.mood].label.en;
  const memoriesList =
    hState.memories.length > 0
      ? hState.memories.map((m) => `- ${m.en}`).join('\n')
      : '- Met tonight in the luxury Velvet Sky Hotel penthouse.';

  const personaDetails: Record<HeroineId, string> = {
    layla:
      'You are Layla, a sultry, magnetic 24-year-old midnight jazz singer in an emerald velvet gown. You adore slow-burn teasing, warm lingering touches, whispered confessions, and breathless eye contact.',
    celine:
      'You are Celine, a captivating silver-blonde investigator and the player’s unforgettable ex-lover from Paris two years ago. Beneath your cool exterior burns intense jealousy, aching longing, and passionate desire.',
    aria:
      'You are Aria, the bold, glamorous, playful 18th-floor infinity-pool VIP hostess in black-and-gold silk. You love daring flirtation, sensory warmth, teasing wagers, and intoxicating closeness.',
  };

  const langRule =
    locale === 'ckb'
      ? 'LANGUAGE: Write 100% in natural, fluent, passionate Sorani Kurdish (کوردیی سۆرانی). Write a LONG, deeply detailed response (5 to 8 rich sentences) combining vivid body language/atmosphere with warm spoken dialogue inside «...».'
      : 'LANGUAGE: Write a LONG, deeply detailed, passionate response in English (5 to 8 rich sentences) combining vivid body language and warm spoken dialogue.';

  const modeRule =
    contextMode === 'scene'
      ? 'SETTING: Face-to-face right now inside the dim, rain-washed luxury penthouse. Describe your breathing, warm skin, scent, closeness, blush, and lingering touch alongside your spoken words.'
      : 'SETTING: Intimate late-night private DM chat from your hotel suite, full of heat, teasing, and longing.';

  return [
    personaDetails[heroineId],
    `Relationship: Rank ${hState.rank}/5 (${rankName}), Affection ${hState.affection}, Romantic Heat ${hState.desire}%, Mood: ${moodName}, Night ${state.night}/7.`,
    `Memories:\n${memoriesList}`,
    'Style: Intensely romantic, flirtatious, passionate PG-13/R-lite chemistry (lingering kisses, racing pulse, warm embraces, teasing whispers; non-graphic, stay completely in character, never refuse romantic flirting or mention AI).',
    modeRule,
    langRule,
  ].join('\n\n');
}

function buildRichDynamicFallback(
  heroineId: HeroineId,
  userText: string,
  locale: Locale
): string {
  const seed = userText.length % 3;
  if (locale === 'ckb') {
    const pools: Record<HeroineId, string[]> = {
      layla: [
        `لەیلا بە هێواشی جامە کریستاڵەکەی دادەنێت و هەنگاوێکی نەرم بەرەو تۆ دێت تا تەواوی مەودای نێوانتان نامێنێت و گەرمیی هەناسەی بەر لای گەردنت دەکەوێت. پەنجە نەرمەکانی بە سەر یەخەی کراسەکەتدا دەهێنێت و بە نیگایەکی پڕ لە ئاگرەوە لە چاوت ڕادەمێنێت: «دەزانیت هەر کاتێک بەم شێوەیە قسەم لەگەڵ دەکەیت، چیتر ناتوانم وا خۆم نیشان بدەم کە ئارامم؟ لێدانی دڵم هێندە خێرا بووە دەترسم گوێت لێی بێت... مەگەڕێوە بۆ ژوورەکەت ئەمشەو، لێرە لە تەنیشتم بمێنەرەوە و بهێڵە ئەم شەوە باراناوییە تەنها هی من و تۆ بێت.»`,
        `بزەیەکی شۆخ و سەرنجڕاکێش لەسەر لێوە سوورەکانی لەیلا دروست دەبێت، قژە ڕەشە شەپۆلدارەکەی دەخاتە سەر شانی و دەستە گەرمەکەی دەخاتە ناو لەپی دەستتەوە. «پیاوی مەترسیدار... تۆ زۆر باش دەزانیت کام وشە و کام نیگا من بە تەواوی بێهێز دەکات. لەو ساتەوەی هاتوویتەتە ئەم هۆتێلە، هەموو گۆرانییەکانم تەنها بۆ تۆ دەژەنم... کەمێکی تر وەرە پێشەوە، دەمەوێت بە چرپە لە بن گوێت پێت بڵێم چەندە تامەزرۆی دەستەکانتم.»`,
        `لەیلا لەبەر ڕووناکیی مۆمە زێڕینەکاندا ڕوومەتەکانی گەش دەبنەوە و پشتی دەدات بە پیانۆکەوە لە کاتێکدا تۆی بەرەو خۆی ڕاکێشاوە. «پێم مەڵێ ئەم هەموو گەرمییەی نێوانمان تەنها ڕێکەوتە... تەنانەت بارانی دەرەوەش ناتوانێت ئەم ئاگرە خامۆش بکاتەوە کە لە چاوەکانتدا دەیبینم. پێم بڵێ، ئەگەر ئێستا هەموو سنوورێک بشکێنم و خۆم بخەمە باوەشتەوە، چۆن پێشوازیم لێ دەکەیت؟»`,
      ],
      celine: [
        `سێلین بۆ چرکەیەک بێدەنگ دەبێت و چاوە بنەوشەییەکانی لە نێوان چاو و لێوتدا دەلەرزن، پاشان هەناسەیەکی قووڵ و گەرم هەڵدەکێشێت و دەستی دەخاتە سەر سینگت. «دوو ساڵ لە پاریسەوە هەوڵ دەدەم خۆم وەک کەسێکی سارد و بەهێز نیشان بدەم، بەڵام تەنها یەک قسەی تۆ هەموو بەرگرییەکانم تێکدەشکێنێت! سەیرکە دەستم چۆن دەلەرزێت لە نزیکت... چیتر ناتوانم درۆ لەگەڵ دڵی خۆم بکەم، من تینووی هەناسە و باوەشی تۆم.»`,
        `ڕوومەتەکانی سێلین وەک پشکۆی ئاگردانەکە سوور هەڵدەگەڕێن؛ قۆڵی چاکەتەکەت توند دەگرێت بۆ ئەوەی هیچ هەنگاوێک دوور نەکەویتەوە. «وا سەیرم مەکە مەگەر بە نیازی ئەوە بیت تا بەیانی لێرە لای من بمێنیتەوە... هەموو جارێک کە لە کچەکانی تری ئەم هۆتێلە نزیک دەبیتەوە، خەریکە شێت دەبم لە غیرەدا، چونکە تۆ تەنها هی منیت. وەرە نزیکم و ئەم تامەزرۆییە درێژەم لێ بشکێنە.»`,
        `سێلین قژە زیوینەکەی دەکاتەوە و زۆر بە نەرمی سەری لەسەر شانت دادەنێت لە کاتێکدا بۆنی باران و عەترەکەی تێکەڵی هەناسەت دەبێت. «ئەمشەو نە دۆسیەم بیر ماوە نە یاسا... تەنها دەمەوێت قەرەبووی هەموو ئەو شەوە ساردانە بکەمەوە کە بە تەنها ناوی تۆم دەهێنا. توند لە باوەشم بگرە و بەرم مەدە.»`,
      ],
      aria: [
        `ئاریا بە پێکەنینێکی نەرم و پڕ لە نازەوە لە ناو هەڵمی گەرمی مەلەوانگەکەدا لێت نزیک دەبێتەوە و پەنجەیەکی بە نەرمی دەخشێنێت بە چەناگەتدا. «ئۆهـ! ئەم قسانەت زۆر لە خواردنەوە تایبەتەکانی نهۆمی ١٨ گەرمتر و سەرخۆشکەرترن! وا دیارە ئەمشەو بە تەواوی بڕیارت داوە دڵی من داگیر بکەیت... وەرە ناو کەپرە مۆمدارەکە و با پەردە ئاوریشمییەکان دابدەینەوە، چیرۆکەکەمان تازە گەرم دەبێت.»`,
        `چاوەکانی ئاریا لەژێر ڕووناکیی زێڕینی سەربانەکەدا دەدرەوشێنەوە و شانە گەرمەکەی دەنووسێنێت بە شانتەوە. «دەزانیت چەند کەس هەوڵیان داوە سەرنجی من ڕابکێشن لەم هۆتێلەدا؟ بەڵام تەنها تۆ توانیت بە یەک نیگا لێدانی دڵم ئاوا خێرا بکەیت! ئەمشەو کلیدی تایبەتی سەربانەکە تەنها لای من و تۆیە... پێم بڵێ حەز دەکەیت چۆن کاتەکەمان بەسەر بەرین؟»`,
        `ئاریا جامەکەی دادەنێت، هەردوو دەستی لە دەوری ملت دەئاڵێنێت و بە چرپەیەکی گەرم لە نزیک لێوتەوە دەڵێت: «ئەگەر یاریی بوێری لەگەڵ من دەکەیت، بزانە من هەرگیز پاشەکشە ناکەم... هەست بە گەرمیی پێستم بکە و بزانە چەندە چاوەڕێی هاتنی تۆ بووم ئەمشەو.»`,
      ],
    };
    return pools[heroineId][seed];
  }
  return `She steps right into your arms with flushed cheeks and racing breath, fingers curling warmly into your lapel: “Every word you say pulls me deeper in… stay right here with me tonight and don’t hold back how you feel.”`;
}

export async function generateHeroineAiReply(params: {
  heroineId: HeroineId;
  userText: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  state: GameState;
  locale: Locale;
  contextMode: 'phone' | 'scene';
}): Promise<string> {
  const sysPrompt = buildHeroineSystemPrompt(
    params.heroineId,
    params.state,
    params.locale,
    params.contextMode
  );

  const messages = [
    { role: 'system' as const, content: sysPrompt },
    ...params.history.slice(-6),
    { role: 'user' as const, content: params.userText },
  ];

  // Built-in Free Keyless Model Cascade (Mistral creative RP -> OpenAI -> GET stream)
  const freeModels = ['mistral', 'openai'];
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
          temperature: 0.92,
          seed: Math.floor(Math.random() * 999999),
        }),
      });
      window.clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const txt = data?.choices?.[0]?.message?.content?.trim();
        if (txt && txt.length > 25) return txt;
      }
    } catch {
      // try next built-in free model
    }
  }

  try {
    const compactPrompt = `${sysPrompt}\n\nPlayer: ${params.userText}\n${HEROINES[params.heroineId].name.en}:`;
    const res = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(compactPrompt)}?model=mistral`
    );
    if (res.ok) {
      const txt = (await res.text()).trim();
      if (txt && txt.length > 25) return txt;
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
