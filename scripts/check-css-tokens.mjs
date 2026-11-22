// Checks every component stylesheet in packages/react/src:
//   1. each var(--ingrid-…) exists in the token JSON;
//   2. it is a category token (tier 3, e.g. Inputs) or one of the shared focus-ring tokens —
//      never a primitive or another semantic token (Ingrid taxonomy);
//   3. there are no raw design values (hex/rgb/hsl colours, px/rem/em sizes).
// No dependencies: `node scripts/check-css-tokens.mjs`.
import fs from 'node:fs';
import path from 'node:path';

const doc = JSON.parse(fs.readFileSync('packages/tokens/src/ingrid.tokens.json', 'utf8'));
const SEMANTIC_OR_PRIMITIVE = new Set(['primitives', 'colors', 'opacity', 'sizes', 'typography']);
const SHARED = new Set(['colors.focus-ring', 'sizes.focus-ring.width', 'sizes.focus-ring.offset']);

const tokenByCss = new Map();
const walk = (node, trail) => {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    if ('$value' in v) tokenByCss.set(v.$extensions['com.figma'].codeSyntax.WEB.slice(4, -1), [...trail, k].join('.'));
    else walk(v, [...trail, k]);
  }
};
walk(doc, []);

const files = [];
const find = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) find(p);
    else if (p.endsWith('.css')) files.push(p);
  }
};
find('packages/react/src');

const problems = [];
for (const file of files) {
  const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  css.split('\n').forEach((line, i) => {
    const where = `${file}:${i + 1}`;
    for (const [, name] of line.matchAll(/var\((--ingrid-[a-z0-9-]+)/g)) {
      const token = tokenByCss.get(name);
      if (!token) problems.push(`${where}  ${name} is not a token`);
      else if (SEMANTIC_OR_PRIMITIVE.has(token.split('.')[0]) && !SHARED.has(token)) {
        problems.push(`${where}  ${name} is ${token}; components use category tokens (or the shared focus-ring tokens) only`);
      }
    }
    if (/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|\b\d*\.?\d+(px|rem|em)\b/i.test(line)) {
      problems.push(`${where}  raw value: ${line.trim()}`);
    }
  });
}

if (problems.length) {
  console.error(`Component CSS breaks the token rules:\n${problems.map((p) => '  ' + p).join('\n')}`);
  process.exit(1);
}
console.log(`${files.length} stylesheet(s) use only category and focus-ring tokens (${tokenByCss.size} tokens known).`);
