import { MOOD_META, RANK_TITLES } from '../data/catalog';
import { HEROINE_OUTFITS } from '../data/outfits';
import { GameState, HeroineId, Locale } from '../types/game';
import { scoreResponseWithHeretic } from './hereticScorer';
import { generateContextualRomanceReply } from './localRomanceEngine';

const SERVER_BUSY_PATTERNS = [
  /pollinations/i,
  /gen\.pollinations/i,
  /important notice/i,
  /deprecated/i,
  /models?\s+(are|is)\s+(currently\s+)?busy/i,
  /currently\s+busy/i,
  /high\s+demand/i,
  /rate[\s-]*limit/i,
  /overloaded/i,
  /queue\s+is\s+full/i,
  /try\s+again\s+later/i,
  /service\s+unavailable/i,
  /bad\s+gateway/i,
  /api[\s_-]*key/i,
  /authentication/i,
  /<!doctype/i,
  /<html/i,
  /سەرقاڵ/,
  /سێرڤەر/,
  /تکایە دواتر/,
  /کێشەی تەکنیکی/,
];

function isValidRoleplayReply(txt: string, locale: Locale): boolean {
  const clean = txt.trim();
  if (!clean || clean.length < 45) return false;
  if (clean.startsWith('{') || clean.startsWith('[')) return false;

  for (const pat of SERVER_BUSY_PATTERNS) {
    if (pat.test(clean)) return false;
  }

  // If Kurdish is active, reject English server banners or non-Kurdish text
  if (locale === 'ckb') {
    const kurdishChars = (clean.match(/[\u0600-\u06FF]/g) || []).length;
    if (kurdishChars < 25) return false;
  }

  const score = scoreResponseWithHeretic(clean);
  if (score.isEmptyOrBroken || score.sycoHits > 0 || score.slopHits > 1) {
    return false;
  }
  return true;
}

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

  const personaDetails: Record<HeroineId, string> = {
    layla: `You are Layla (24), midnight jazz vocalist, currently ${outfitDesc}. Bold, sensual, confident; loves breathless closeness and intimate whispers.`,
    celine: `You are Celine (25), silver-blonde private investigator and Sipan's unforgettable ex-lover from Paris, currently ${outfitDesc}. Cool armor melting into trembling desire and intense longing.`,
    aria: `You are Aria (23), glamorous 18th-floor rooftop pool & silk cabana hostess, currently ${outfitDesc}. Playful, fearless, seductive; loves heated closeness and late-night wagers.`,
  };

  const langRule =
    locale === 'ckb'
      ? 'LANGUAGE: Write 100% in natural, fluent Sorani Kurdish (کوردیی سۆرانی). Address the player warmly as «سیپان» (Sipan). Write 2 vivid, deeply romantic paragraphs blending physical closeness, touch, and outfit details with spoken dialogue inside «...». Never mention AI, servers, or technical status.'
      : 'LANGUAGE: Address the player warmly as Sipan. Write 2 vivid, deeply romantic paragraphs in English blending physical closeness, touch, and spoken dialogue. Never mention AI or technical status.';

  const modeRule =
    contextMode === 'scene'
      ? 'SETTING: Alone together with Sipan inside a private candlelit suite or rooftop cabana.'
      : 'SETTING: Intimate late-night private DM with Sipan, inviting him to walk to your room right now.';

  return [
    personaDetails[heroineId],
    `Stats: Rank ${hState.rank}/5 (${rankName}), Affection ${hState.affection}, Desire ${hState.desire}%, Mood: ${moodName}, Night ${state.night}/7.`,
    'Style: High-tension consensual adult romance (non-graphic/non-explicit). Zero robotic filler.',
    modeRule,
    langRule,
  ].join('\n\n');
}

const SNAP_ROTATION_COUNTER: Record<HeroineId, number> = {
  layla: 0,
  celine: 0,
  aria: 0,
};

export function buildFreeAiSelfieUrl(heroineId: HeroineId): string {
  const extraSnaps: Record<HeroineId, string[]> = {
    layla: [
      ...HEROINE_OUTFITS.layla.map((o) => o.image),
      '/assets/cg_layla_kiss.jpg',
      '/assets/spa_layla_steam.jpg',
      '/assets/cg_sipan_trio.jpg',
    ],
    celine: [
      ...HEROINE_OUTFITS.celine.map((o) => o.image),
      '/assets/cg_celine_embrace.jpg',
      '/assets/spa_celine_shower.jpg',
      '/assets/cg_sipan_trio.jpg',
    ],
    aria: [
      ...HEROINE_OUTFITS.aria.map((o) => o.image),
      '/assets/cg_aria_cabana.jpg',
      '/assets/spa_aria_jacuzzi.jpg',
      '/assets/cg_sipan_trio.jpg',
    ],
  };
  const pool = extraSnaps[heroineId];
  const idx = SNAP_ROTATION_COUNTER[heroineId] % pool.length;
  SNAP_ROTATION_COUNTER[heroineId] += 1;
  return pool[idx];
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
    ...params.history.slice(-6),
    { role: 'user' as const, content: params.userText },
  ];

  // Try fast zero-key cloud inference first (strictly rejecting any busy/rate-limit banners)
  const endpoints = [
    { url: 'https://text.pollinations.ai/openai', model: 'openai-fast' },
    { url: 'https://text.pollinations.ai/openai', model: 'openai' },
  ];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5500);
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: ep.model,
          messages,
          private: true,
          temperature: 0.9,
          max_tokens: 520,
          seed: Math.floor(Math.random() * 999999),
        }),
      });
      window.clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const txt = data?.choices?.[0]?.message?.content?.trim() || '';
        if (isValidRoleplayReply(txt, params.locale)) {
          return txt;
        }
      }
    } catch {
      // Fall through cleanly to next endpoint or instant local romance engine
    }
  }

  // Instant, zero-failure, context-aware local Sorani Kurdish & English romance engine
  return generateContextualRomanceReply({
    heroineId: params.heroineId,
    userText: params.userText,
    historyCount: params.history.length,
    state: params.state,
    locale: params.locale,
    contextMode: params.contextMode,
    outfitId: params.outfitId,
  });
}
