// Validates every component contract, writes dist/contracts.json and generates the type
// file next to each contract.
//
// For each packages/react/src/**/<Name>.contract.json it checks that:
//   1. the contract is valid JSON with every required field and no unknown ones
//      (contract.schema.json describes them), and each prop default is one of its values;
//   2. for every combination of props × states, each token binding that applies resolves to
//      a real token (or text style), and no part/property gets two different tokens;
//   3. only the category collection, text styles and the shared focus-ring tokens are used;
//   4. every binding applies to at least one combination (no dead bindings);
//   5. <Name>.module.css uses exactly the --ingrid- tokens the contract lists, no more, no less;
//   6. <Name>.stories.tsx exists, exports Playground and has the contract's title.
//
// It also writes <Name>.contract.d.json.ts: the contract's exact literal types, so that
// `import contract from './Button.contract.json'` gives 'filled' | 'outlined' | 'text'
// instead of string. The file is generated; CI fails if it is out of date.
// No dependencies: `node packages/contracts/scripts/build.mjs`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const COMPONENTS = path.join(repo, 'packages/react/src');
const TOKENS = path.join(repo, 'packages/tokens/src/ingrid.tokens.json');
const OUT = path.resolve(here, '../dist/contracts.json');

// Shared semantic tokens every component may use directly (Ingrid taxonomy: focus ring).
const SHARED = new Set(['colors.focus-ring', 'sizes.focus-ring.width', 'sizes.focus-ring.offset']);

// ---- tokens ---------------------------------------------------------------------------------
const doc = JSON.parse(fs.readFileSync(TOKENS, 'utf8'));
const meta = doc.$extensions['com.figma'];
const collectionKeys = new Set(meta.collections.map((c) => c.key));
const textStyles = new Set(meta.textStyles.map((s) => s.name));
const cssOf = new Map(); // dotted path -> --ingrid-…
const walk = (node, trail) => {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    if ('$value' in v) cssOf.set([...trail, k].join('.'), v.$extensions['com.figma'].codeSyntax.WEB.slice(4, -1));
    else walk(v, [...trail, k]);
  }
};
walk(doc, []);

// ---- find contracts -------------------------------------------------------------------------
const files = [];
const find = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) find(p);
    else if (e.name.endsWith('.contract.json')) files.push(p);
  }
};
find(COMPONENTS);

const combos = (contract) => {
  let list = [{}];
  for (const [prop, def] of Object.entries(contract.props)) {
    list = list.flatMap((c) => def.values.map((v) => ({ ...c, [prop]: v })));
  }
  return list.flatMap((c) => contract.states.map((s) => ({ ...c, state: s })));
};
const applies = (binding, combo) =>
  Object.entries(binding.when ?? {}).every(([k, allowed]) => allowed.includes(combo[k]));
const fill = (template, combo, contract) =>
  template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = combo[k];
    if (v === undefined) throw new Error(`unknown placeholder {${k}}`);
    return k === 'state' ? (contract.stateTokenNames?.[v] ?? v) : v;
  });

const KNOWN = new Set(Object.keys(JSON.parse(fs.readFileSync(path.resolve(here, '../contract.schema.json'), 'utf8')).properties));

// Literal TypeScript type of a JSON value, readonly all the way down.
const typeOf = (v, indent = 0) => {
  const pad = '  '.repeat(indent);
  if (Array.isArray(v)) return `readonly [${v.map((x) => typeOf(x, indent)).join(', ')}]`;
  if (v && typeof v === 'object') {
    const body = Object.entries(v).map(([k, x]) => `${pad}  readonly ${JSON.stringify(k)}: ${typeOf(x, indent + 1)};`).join('\n');
    return `{\n${body}\n${pad}}`;
  }
  return JSON.stringify(v);
};
const typeFile = (name, contract) => {
  const { $schema, ...rest } = contract;
  return `// Generated from ${name}.contract.json by packages/contracts/scripts/build.mjs. Do not edit.
// Gives the JSON import its exact literal types (TypeScript allowArbitraryExtensions).
declare const contract: ${typeOf(rest)};
export default contract;
`;
};

const problems = [];
const out = [];

for (const file of files.sort()) {
  const rel = path.relative(repo, file);
  const name = path.basename(file, '.contract.json');
  const dir = path.dirname(file);
  const err = (m) => problems.push(`${rel}: ${m}`);
  let contract;
  try {
    contract = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    err(`not valid JSON: ${e.message}`);
    continue;
  }
  for (const key of Object.keys(contract)) if (!KNOWN.has(key)) err(`unknown field "${key}"`);

  // 1. shape
  const missing = ['name', 'status', 'description', 'category', 'anatomy', 'props', 'states', 'tokens', 'a11y', 'rules', 'figma', 'storybook']
    .filter((key) => contract?.[key] === undefined);
  for (const key of missing) err(`missing "${key}"`);
  if (missing.length) continue;
  if (contract.name !== name) err(`name "${contract.name}" does not match the file name "${name}"`);
  if (!['alpha', 'beta', 'stable', 'deprecated'].includes(contract.status)) err(`unknown status "${contract.status}"`);
  if (!collectionKeys.has(contract.category)) err(`category "${contract.category}" is not a token collection`);
  if (contract.states[0] !== 'default') err(`states must start with "default"`);
  for (const [prop, def] of Object.entries(contract.props)) {
    if (!def.values.includes(def.default)) err(`props.${prop}.default "${def.default}" is not one of its values`);
    if (!def.figma) err(`props.${prop} has no Figma property name`);
  }

  // 2–4. bindings
  const used = new Map(); // binding index -> count
  const resolved = new Map(); // css name -> token path
  const cells = [];
  for (const combo of combos(contract)) {
    const seen = new Map();
    const cell = { combo, bindings: [] };
    contract.tokens.forEach((b, i) => {
      if (!applies(b, combo)) return;
      used.set(i, (used.get(i) ?? 0) + 1);
      let token;
      try { token = fill(b.token, combo, contract); } catch (e) { err(`tokens[${i}]: ${e.message}`); return; }
      const key = `${b.part}.${b.property}`;
      if (seen.has(key) && seen.get(key) !== token) err(`${key} gets both ${seen.get(key)} and ${token} for ${JSON.stringify(combo)}`);
      seen.set(key, token);
      if (b.property === 'textStyle') {
        if (!textStyles.has(token)) err(`tokens[${i}]: text style "${token}" does not exist`);
        cell.bindings.push({ part: b.part, property: b.property, textStyle: token });
        return;
      }
      const segs = token.split('/');
      const dotted = collectionKeys.has(segs[0]) ? segs.join('.') : [contract.category, ...segs].join('.');
      if (collectionKeys.has(segs[0]) && !SHARED.has(dotted)) err(`tokens[${i}]: ${token} is outside the "${contract.category}" collection; only the focus-ring tokens are shared`);
      const css = cssOf.get(dotted);
      if (!css) { err(`tokens[${i}]: ${dotted} does not exist (for ${JSON.stringify(combo)})`); return; }
      resolved.set(css, dotted);
      cell.bindings.push({ part: b.part, property: b.property, token: dotted, css });
    });
    cells.push(cell);
  }
  contract.tokens.forEach((b, i) => { if (!used.get(i)) err(`tokens[${i}] (${b.part}.${b.property}) never applies`); });

  // 5. CSS module matches the contract
  const cssFile = path.join(dir, `${name}.module.css`);
  if (!fs.existsSync(cssFile)) err(`missing ${name}.module.css`);
  else {
    const css = fs.readFileSync(cssFile, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const inCss = new Set([...css.matchAll(/var\((--ingrid-[a-z0-9-]+)/g)].map((m) => m[1]));
    for (const v of inCss) if (!resolved.has(v)) err(`${name}.module.css uses ${v}, which the contract does not list`);
    for (const v of resolved.keys()) if (!inCss.has(v)) err(`contract lists ${v} (${resolved.get(v)}), but ${name}.module.css never uses it`);
  }

  // 6. stories
  const storyFile = path.join(dir, `${name}.stories.tsx`);
  if (!fs.existsSync(storyFile)) err(`missing ${name}.stories.tsx`);
  else {
    const src = fs.readFileSync(storyFile, 'utf8');
    for (const story of ['Playground']) {
      if (!new RegExp(`export const ${story}\\b`).test(src)) err(`${name}.stories.tsx has no "${story}" story`);
    }
    // Storybook only accepts a string literal title, so it can't be read from the contract.
    const title = src.match(/\btitle:\s*(['"])(.+?)\1/)?.[2];
    if (title !== contract.storybook.title) err(`${name}.stories.tsx title is ${title ? `"${title}"` : 'not a string literal'}; the contract says "${contract.storybook.title}"`);
  }

  const typesPath = path.join(dir, `${name}.contract.d.json.ts`);
  const types = typeFile(name, contract);
  if (!fs.existsSync(typesPath) || fs.readFileSync(typesPath, 'utf8') !== types) fs.writeFileSync(typesPath, types);

  const { $schema, ...data } = contract;
  out.push({ ...data, source: rel, combinations: cells.length, resolvedTokens: Object.fromEntries(resolved), matrix: cells });
}

if (problems.length) {
  console.error(`Contract check failed with ${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generatedFrom: 'packages/react/src/**/*.contract.json', contracts: out }, null, 2) + '\n');
console.log(`${out.length} contract(s) valid: ${out.map((c) => `${c.name} (${c.combinations} combinations, ${Object.keys(c.resolvedTokens).length} tokens)`).join(', ')}. Wrote ${path.relative(process.cwd(), OUT)}`);
