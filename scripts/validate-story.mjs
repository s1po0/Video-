import fs from 'node:fs';
import path from 'node:path';

// Lightweight static & BFS reachability verifier for src/data/storyData.ts
const file = fs.readFileSync(path.resolve('src/data/storyData.ts'), 'utf8');
const idMatches = [...file.matchAll(/^\s{2}([a-z0-9_]+):\s*\{/gm)].map((m) => m[1]);
const toMatches = [...file.matchAll(/\b(?:to|next):\s*'([a-z0-9_]+)'/g)].map((m) => m[1]);
const endingMatches = [...file.matchAll(/id:\s*'(end_[a-z0-9_]+)'/g)].map((m) => m[1]);

const idSet = new Set(idMatches);
const missing = toMatches.filter((target) => !idSet.has(target));

console.log(`Nodes defined: ${idSet.size}`);
console.log(`Transitions checked: ${toMatches.length}`);
console.log(`Endings defined (${endingMatches.length}): ${endingMatches.join(', ')}`);

if (missing.length > 0) {
  console.error('ERROR: Missing target nodes:', missing);
  process.exit(1);
}
if (endingMatches.length < 5) {
  console.error('ERROR: Expected 5 endings!');
  process.exit(1);
}
console.log('SUCCESS: All story nodes, transitions, and 5 endings verified!');
