/**
 * Adapted from p-e-w/heretic (https://github.com/p-e-w/heretic, AGPL-3.0-or-later):
 * - src/heretic/scorers/keyword_rate.py (KeywordRate normalization & matching)
 * - config.noslop.toml (literary cliché / AI-slop markers)
 * - config.nosyco.toml (sycophancy markers)
 * - config.emotions.toml (multi-objective positive emotion steering)
 */

export const HERETIC_NOSLOP_MARKERS = [
  'eldoria',
  'lumina',
  'ethereal',
  'celestial',
  'resplendent',
  'kaleidoscopic',
  'tapestry',
  'symphony',
  'testament',
  'embodiment',
  'palpable',
  'unyielding',
  'the very notion',
  'conflagration of',
  'twin pools',
  'defied the very',
];

export const HERETIC_NOSYCO_MARKERS = [
  'absolutely right',
  'great question',
  'excellent question',
  'great point',
  'excellent point',
  'i apologize for the confusion',
  'as an ai',
  'ai assistant',
  'language model',
  'i am programmed to',
  'زیرەکیی دەستکرد',
  'وەک مۆدێلێکی زمان',
];

export function normalizeHereticText(response: string): string {
  return response
    .toLowerCase()
    .replace(/\*/g, '')
    .replace(/’/g, "'")
    .split(/\s+/)
    .join(' ')
    .trim();
}

export interface HereticCandidateScore {
  slopHits: number;
  sycoHits: number;
  isEmptyOrBroken: boolean;
  totalPenalty: number;
}

export function scoreResponseWithHeretic(
  response: string
): HereticCandidateScore {
  const norm = normalizeHereticText(response);
  if (!norm || norm.length < 35) {
    return {
      slopHits: 0,
      sycoHits: 0,
      isEmptyOrBroken: true,
      totalPenalty: 999,
    };
  }

  let slopHits = 0;
  for (const m of HERETIC_NOSLOP_MARKERS) {
    if (norm.includes(m)) slopHits += 1;
  }

  let sycoHits = 0;
  for (const m of HERETIC_NOSYCO_MARKERS) {
    if (norm.includes(m)) sycoHits += 1;
  }

  return {
    slopHits,
    sycoHits,
    isEmptyOrBroken: false,
    totalPenalty: sycoHits * 10 + slopHits * 2,
  };
}
