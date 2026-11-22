// Pure token builder: turns src/ingrid.tokens.json (the source of truth) into the dist/ files.
//
// Ported from Ingrid's packages/tokens/scripts/build-core.mjs. No Node APIs and no
// dependencies, so the same code can later run inside the Figma sync plugin.

const HEADER = '/* Generated from packages/tokens/src/ingrid.tokens.json by scripts/build.mjs. Do not edit by hand. */\n';

/**
 * @param {object} doc parsed ingrid.tokens.json
 * @returns {{ files: Record<string, string>, tokenCount: number, textStyleCount: number }}
 *   files is keyed by file name inside dist/. Throws if the export has problems.
 */
export function buildTokenFiles(doc) {
  const meta = doc.$extensions?.['com.figma'];
  if (!meta) throw new Error('ingrid.tokens.json has no $extensions["com.figma"] block (collections, modes, text styles).');
  const errors = [];
  const fail = () => {
    if (!errors.length) return;
    const err = new Error(`Token build failed with ${errors.length} problem(s):\n` + errors.map((e) => `  - ${e}`).join('\n'));
    err.problems = errors.slice();
    throw err;
  };

  // ---- collect tokens ---------------------------------------------------------------------
  const tokens = new Map(); // dotted path -> token
  const walk = (node, trail) => {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('$') || !value || typeof value !== 'object') continue;
      const here = [...trail, key];
      if ('$value' in value) tokens.set(here.join('.'), { path: here, ...value });
      else walk(value, here);
    }
  };
  walk(doc, []);

  const cssName = new Map(); // dotted path -> --ingrid-…
  const seen = new Map();
  for (const [p, t] of tokens) {
    const web = t.$extensions?.['com.figma']?.codeSyntax?.WEB;
    const m = typeof web === 'string' && web.match(/^var\((--[a-z0-9-]+)\)$/);
    if (!m) { errors.push(`${p}: missing or invalid WEB code syntax (${web})`); continue; }
    if (seen.has(m[1])) errors.push(`${p}: CSS name ${m[1]} is also used by ${seen.get(m[1])}`);
    seen.set(m[1], p);
    cssName.set(p, m[1]);
  }

  const refPath = (ref) => {
    const m = typeof ref === 'string' && ref.match(/^\{(.+)\}$/);
    return m ? m[1] : null;
  };
  const varOf = (ref, where) => {
    const p = refPath(ref);
    if (!p || !cssName.has(p)) { errors.push(`${where}: broken reference ${ref}`); return 'unset'; }
    return `var(${cssName.get(p)})`;
  };

  // ---- value formatting ---------------------------------------------------------------------
  // Primitives carry the units; everything above them is var() references, so units flow through.
  const unitFor = (t) => {
    if (t.path.includes('opacity')) return 'ratio';      // Figma 0–100  ->  CSS 0–1
    if (t.path.includes('font-weight')) return 'none';
    return 'px';
  };
  const literal = (t, value) => {
    switch (t.$type) {
      case 'color': return String(value);
      case 'number': {
        const unit = unitFor(t);
        if (unit === 'ratio') return String(Math.round((value / 100) * 10000) / 10000);
        if (unit === 'none') return String(value);
        return value === 0 ? '0' : `${value}px`;
      }
      case 'string': return t.path.includes('font-family') ? `"${value}", sans-serif` : JSON.stringify(value);
      case 'boolean': return value ? '1' : '0';
      default: errors.push(`${t.path.join('.')}: unsupported type ${t.$type}`); return 'unset';
    }
  };
  const format = (t, value, where) => {
    if (typeof value === 'string' && refPath(value)) return varOf(value, where);
    if (value && typeof value === 'object' && 'color' in value && 'opacity' in value) {
      // Colour + opacity value: keep both references.
      return `color-mix(in srgb, ${varOf(value.color, where)} calc(${varOf(value.opacity, where)} * 100%), transparent)`;
    }
    return literal(t, value);
  };

  // ---- group declarations by collection and mode -------------------------------------------
  const collections = meta.collections; // [{ key, name, modes, defaultMode }]
  const byKey = new Map(collections.map((c) => [c.key, c]));
  const blocks = { primitives: [], base: [], modes: new Map() }; // modes: modeName -> lines

  for (const [p, t] of tokens) {
    const name = cssName.get(p);
    if (!name) continue;
    const col = byKey.get(t.path[0]);
    if (!col) { errors.push(`${p}: unknown collection ${t.path[0]}`); continue; }
    const modes = t.$extensions['com.figma'].modes;
    const isPrimitive = !Object.values(modes).some((v) => (typeof v === 'string' && refPath(v)) || (v && typeof v === 'object'));
    const line = (value) => `  ${name}: ${format(t, value, p)};`;
    const target = isPrimitive && col.modes.length === 1 ? blocks.primitives : blocks.base;
    target.push(line(modes[col.defaultMode]));
    for (const mode of col.modes) {
      if (mode === col.defaultMode) continue;
      if (!blocks.modes.has(mode)) blocks.modes.set(mode, []);
      blocks.modes.get(mode).push(line(modes[mode]));
    }
  }

  fail();

  // ---- tokens.css -------------------------------------------------------------------------
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const defaultModes = [...new Set(collections.filter((c) => c.modes.length > 1).map((c) => slug(c.defaultMode)))];
  let css = HEADER;
  css += '\n/* Primitives: raw values. Use the semantic tokens below in components. */\n';
  css += `:root {\n${blocks.primitives.join('\n')}\n}\n`;
  css += `\n/* Semantic and category tokens. Default mode (${defaultModes.join(', ')}).\n`;
  css += '   Declared on every [data-theme] element as well, so aliases re-resolve inside a themed subtree. */\n';
  css += `:root,\n[data-theme] {\n${blocks.base.join('\n')}\n}\n`;
  for (const [mode, lines] of blocks.modes) {
    const m = slug(mode);
    css += `\n/* ${mode} mode: set data-theme="${m}" on <html> or on any element. */\n`;
    css += `[data-theme="${m}"] {\n${lines.join('\n')}\n}\n`;
    if (m === 'dark') {
      css += `\n/* Follow the operating system when no theme is set. */\n`;
      css += `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme]) {\n${lines.map((l) => '  ' + l).join('\n')}\n  }\n}\n`;
    }
  }

  // ---- text-styles.css --------------------------------------------------------------------
  let textCss = HEADER + '\n/* One class per text style. All values come from the Typography collection. */\n';
  const props = { fontFamily: 'font-family', fontSize: 'font-size', lineHeight: 'line-height', fontWeight: 'font-weight', letterSpacing: 'letter-spacing' };
  for (const s of meta.textStyles) {
    const cls = `.ingrid-text-${slug(s.name)}`;
    const decls = Object.entries(props).filter(([k]) => s[k]).map(([k, prop]) => `  ${prop}: ${varOf(s[k], s.name)};`);
    textCss += `\n/* ${s.name}${s.description ? ': ' + s.description : ''} */\n${cls} {\n${decls.join('\n')}\n}\n`;
  }
  fail();

  // ---- tokens.js / tokens.d.ts ------------------------------------------------------------
  const entries = [...cssName.entries()].map(([p, n]) => [p, `var(${n})`]);
  const js = `// Generated from packages/tokens/src/ingrid.tokens.json by scripts/build.mjs. Do not edit by hand.\n` +
    `/** Every token, keyed by its path (collection.group.name), as a CSS var() reference. */\n` +
    `export const tokens = Object.freeze({\n${entries.map(([p, v]) => `  ${JSON.stringify(p)}: ${JSON.stringify(v)},`).join('\n')}\n});\n` +
    `\n/** Text style class names, keyed by text style name. */\n` +
    `export const textStyles = Object.freeze({\n${meta.textStyles.map((s) => `  ${JSON.stringify(s.name)}: ${JSON.stringify('ingrid-text-' + slug(s.name))},`).join('\n')}\n});\n`;
  const dts = `// Generated from packages/tokens/src/ingrid.tokens.json by scripts/build.mjs. Do not edit by hand.\n` +
    `export type TokenPath =\n${entries.map(([p]) => `  | ${JSON.stringify(p)}`).join('\n')};\n` +
    `export declare const tokens: Readonly<Record<TokenPath, string>>;\n` +
    `export type TextStyleName =\n${meta.textStyles.map((s) => `  | ${JSON.stringify(s.name)}`).join('\n')};\n` +
    `export declare const textStyles: Readonly<Record<TextStyleName, string>>;\n`;


  return {
    files: { 'tokens.css': css, 'text-styles.css': textCss, 'tokens.js': js, 'tokens.d.ts': dts },
    tokenCount: cssName.size,
    textStyleCount: meta.textStyles.length,
  };
}
