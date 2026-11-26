import { ConditionClause, StoryNode, StoryVars } from '../types/story';

export const DEFAULT_VARS: StoryVars = {
  layla_affection: 0,
  celine_affection: 0,
  chemistry: 1,
  trust: 1,
  boldness: 1,
  gave_jacket: false,
  won_dare: false,
  paris_truth: false,
  found_locket: false,
  danced_with_layla: false,
  held_celine_hand: false,
  kept_secret: false,
};

export function evaluateConditions(
  clauses: ConditionClause[] | undefined,
  vars: StoryVars
): boolean {
  if (!clauses || clauses.length === 0) return true;
  return clauses.every((c) => {
    const actual = vars[c.var];
    if (c.op === '==') return actual === c.value;
    if (typeof actual === 'number' && typeof c.value === 'number') {
      if (c.op === '>=') return actual >= c.value;
      if (c.op === '<=') return actual <= c.value;
    }
    return false;
  });
}

export function resolveNodeId(
  targetId: string,
  nodes: Record<string, StoryNode>,
  vars: StoryVars
): string {
  let currentId = targetId;
  let guard = 0;
  while (guard < 10) {
    guard++;
    const node = nodes[currentId];
    if (!node || !node.redirects || node.redirects.length === 0) {
      return currentId;
    }
    const matched = node.redirects.find((r) => evaluateConditions(r.conditions, vars));
    if (matched) {
      currentId = matched.to;
    } else if (node.next) {
      currentId = node.next;
    } else {
      return currentId;
    }
  }
  return currentId;
}
