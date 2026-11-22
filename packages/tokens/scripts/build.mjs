// Builds the token outputs from the source of truth.
//
//   src/ingrid.tokens.json  ->  dist/tokens.css        CSS custom properties (Light + Dark)
//                               dist/text-styles.css   one class per text style
//                               dist/tokens.js/.d.ts   token paths -> var(--ingrid-…)
//
// Code is the source of truth: edit the JSON, run this, and the Figma sync plugin later
// writes the same values into Figma. Every CSS name is the token's WEB code syntax, and
// every alias stays an alias (var() pointing at var()).
// No dependencies: `node packages/tokens/scripts/build.mjs`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTokenFiles } from './build-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src/ingrid.tokens.json');
const DIST = path.join(root, 'dist');

let result;
try {
  result = buildTokenFiles(JSON.parse(fs.readFileSync(SRC, 'utf8')));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

fs.mkdirSync(DIST, { recursive: true });
for (const [name, content] of Object.entries(result.files)) fs.writeFileSync(path.join(DIST, name), content);
console.log(`Built ${result.tokenCount} tokens and ${result.textStyleCount} text styles into ${path.relative(process.cwd(), DIST)}/`);
