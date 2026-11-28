// Checks src/ingrid.tokens.json against the Ingrid variable taxonomy, so the JSON alone is
// enough to rebuild the Figma variables. Fails (exit 1) on any rule break; contrast results
// are warnings unless run with --strict-contrast.
//
// Rules (docs: https://github.com/Gabigabor/InGrid/blob/main/docs/variable-taxonomy.md):
//   1. Every token has $type, $description and $extensions["com.figma"] with
//      collection, codeSyntax.WEB, scopes and a value for every mode of its collection.
//   2. Its collection matches its top-level group, and the mode names match the collection.
//   3. Scopes: primitives have none; nobody uses ALL_SCOPES.
//   4. Tiers alias one tier up only: semantic -> primitives, category -> semantic.
//      Primitives hold raw values only.
//   5. Text styles bind all five properties to Typography tokens.
//   6. Contrast: text/background pairs in Inputs reach 4.5:1 in Light and Dark.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const doc = JSON.parse(fs.readFileSync(path.join(root, 'src/ingrid.tokens.json'), 'utf8'));
const strictContrast = process.argv.includes('--strict-contrast');

const TIER = { primitives: 1, colors: 2, opacity: 2, sizes: 2, typography: 2 }; // everything else: 3 (category)
const tierOf = (collectionKey) => TIER[collectionKey] ?? 3;

const meta = doc.$extensions?.['com.figma'];
const errors = [];
const warnings = [];
if (!meta?.collections) {
  console.error('Missing $extensions["com.figma"].collections');
  process.exit(1);
}
const collections = new Map(meta.collections.map((c) => [c.key, c]));

// ---- collect --------------------------------------------------------------------------------
const tokens = new Map();
const walk = (node, trail) => {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$') || !value || typeof value !== 'object') continue;
    const here = [...trail, key];
    if ('$value' in value) tokens.set(here.join('.'), { path: here, ...value });
    else walk(value, here);
  }
};
walk(doc, []);

const refOf = (v) => (typeof v === 'string' && v.match(/^\{(.+)\}$/)?.[1]) || null;
const refsIn = (v) => {
  if (refOf(v)) return [refOf(v)];
  if (v && typeof v === 'object') return [v.color, v.opacity].map(refOf).filter(Boolean);
  return [];
};

// ---- rules 1–4 ------------------------------------------------------------------------------
for (const [p, t] of tokens) {
  const fig = t.$extensions?.['com.figma'];
  const col = collections.get(t.path[0]);
  if (!t.$type) errors.push(`${p}: no $type`);
  if (!t.$description?.trim()) errors.push(`${p}: no $description`);
  if (!fig) { errors.push(`${p}: no $extensions["com.figma"]`); continue; }
  if (!col) { errors.push(`${p}: top-level group "${t.path[0]}" is not a declared collection`); continue; }
  if (fig.collection !== col.name) errors.push(`${p}: collection "${fig.collection}" but lives under "${col.name}"`);
  if (!/^var\(--ingrid-[a-z0-9-]+\)$/.test(fig.codeSyntax?.WEB ?? '')) errors.push(`${p}: WEB code syntax must be var(--ingrid-…), got ${fig.codeSyntax?.WEB}`);
  if (!Array.isArray(fig.scopes)) errors.push(`${p}: scopes missing`);
  else if (fig.scopes.includes('ALL_SCOPES')) errors.push(`${p}: uses ALL_SCOPES`);
  else if (tierOf(t.path[0]) === 1 && fig.scopes.length) errors.push(`${p}: primitives must have no scopes`);

  const modeNames = Object.keys(fig.modes ?? {});
  for (const m of col.modes) if (!modeNames.includes(m)) errors.push(`${p}: no value for mode "${m}"`);
  for (const m of modeNames) if (!col.modes.includes(m)) errors.push(`${p}: unknown mode "${m}"`);

  const tier = tierOf(t.path[0]);
  for (const [mode, value] of Object.entries(fig.modes ?? {})) {
    const refs = refsIn(value);
    if (tier === 1 && refs.length) errors.push(`${p} [${mode}]: primitives hold raw values, not aliases`);
    if (tier > 1 && !refs.length) errors.push(`${p} [${mode}]: raw value ${JSON.stringify(value)}; alias a tier-${tier - 1} token instead`);
    for (const r of refs) {
      const target = tokens.get(r);
      if (!target) { errors.push(`${p} [${mode}]: broken alias {${r}}`); continue; }
      const want = tier === 2 ? 1 : 2;
      if (tierOf(target.path[0]) !== want) errors.push(`${p} [${mode}]: aliases {${r}} (tier ${tierOf(target.path[0])}); tier ${tier} may only alias tier ${want}`);
    }
  }
}

// ---- rule 5: text styles ---------------------------------------------------------------------
for (const s of meta.textStyles ?? []) {
  for (const prop of ['fontFamily', 'fontSize', 'lineHeight', 'fontWeight', 'letterSpacing']) {
    const r = refOf(s[prop]);
    if (!r) errors.push(`text style ${s.name}: ${prop} is not bound to a token`);
    else if (!tokens.has(r)) errors.push(`text style ${s.name}: ${prop} points at missing {${r}}`);
    else if (!r.startsWith('typography.')) errors.push(`text style ${s.name}: ${prop} must bind a Typography token, not {${r}}`);
  }
}

// ---- rule 6: contrast ------------------------------------------------------------------------
const resolve = (p, mode, seen = new Set()) => {
  const t = tokens.get(p);
  if (!t || seen.has(p)) return null;
  seen.add(p);
  const modes = t.$extensions['com.figma'].modes;
  const v = modes[mode] ?? Object.values(modes)[0];
  if (refOf(v)) return resolve(refOf(v), mode, seen);
  return typeof v === 'string' && v.startsWith('#') ? v : null; // translucent values are skipped
};
const luminance = (hex) => {
  const n = hex.replace('#', '').slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const contrast = [];
const colorModes = collections.get('colors')?.modes ?? ['Light'];
for (const [p] of tokens) {
  const m = p.match(/^(inputs\.color\.[a-z-]+)\.filled\.label$/);
  if (!m) continue;
  const bg = `${m[1]}.filled.background`;
  if (!tokens.has(bg)) continue;
  for (const mode of colorModes) {
    const [fg, back] = [resolve(p, mode), resolve(bg, mode)];
    if (!fg || !back) continue;
    const r = ratio(fg, back);
    const line = `${p} on ${bg} [${mode}]: ${r.toFixed(2)}:1`;
    contrast.push(line);
    if (r < 4.5) (strictContrast ? errors : warnings).push(`contrast below 4.5:1 — ${line}`);
  }
}

// ---- report ---------------------------------------------------------------------------------
for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  console.error(`Token validation failed with ${errors.length} problem(s):\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  process.exit(1);
}
console.log(`${tokens.size} tokens and ${meta.textStyles?.length ?? 0} text styles follow the taxonomy. ${contrast.length} contrast pairs checked.`);
