/// <reference types="vite/client" />
// What each Ingrid variable is declared as in tokens.css, per colour mode,
// e.g. "--ingrid-color-surface-default" -> "var(--ingrid-color-white)".
import tokensCss from '../../../packages/tokens/dist/tokens.css?raw';

export type Theme = 'light' | 'dark';

export const declared: Record<Theme, Map<string, string>> = (() => {
  const light = new Map<string, string>();
  const dark = new Map<string, string>();
  // The OS-preference @media block is skipped: it only repeats the dark values.
  const css = tokensCss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  for (const [, selector = '', body = ''] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const target = selector.includes('data-theme="dark"') ? dark : light;
    for (const [, name = '', value = ''] of body.matchAll(/(--ingrid-[\w-]+)\s*:\s*([^;]+);/g)) {
      target.set(name, value.trim());
    }
  }
  return { light, dark };
})();

/** "var(--ingrid-color-white)" -> "color-white"; anything else is returned as written. */
export const shortValue = (value?: string) => value?.replace(/var\(--ingrid-([\w-]+)\)/g, '$1') ?? '';

/** Follows pure aliases: input-primary-filled-label -> color-primary-… -> color-neutral-900. */
export function aliasChain(cssVar: string, theme: Theme): string[] {
  const chain: string[] = [];
  let current = cssVar;
  for (let i = 0; i < 10; i++) {
    const value = declared[theme].get(current) ?? declared.light.get(current);
    const next = value?.match(/^var\((--ingrid-[\w-]+)\)$/)?.[1];
    if (!next) break;
    chain.push(next);
    current = next;
  }
  return chain;
}

// ---- alias and raw value (shared by the Tokens pages, the Tokens tab and the Contract tab) ----
import { tokens } from '../../../packages/tokens/dist/tokens.js';
import type { AliasRef } from './token-value';

const pathByCss = new Map(Object.entries(tokens).map(([path, ref]) => [ref.slice(4, -1), path]));
const collectionLabel = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);

/** What a variable aliases in one mode, as Figma variable names (two for colour + opacity). */
export function aliasRefs(cssVar: string, theme: Theme): AliasRef[] {
  const value = declared[theme].get(cssVar) ?? declared.light.get(cssVar) ?? '';
  return [...value.matchAll(/var\((--ingrid-[\w-]+)\)/g)].map((m) => {
    const [collection = '', ...rest] = (pathByCss.get(m[1] ?? '') ?? m[1] ?? '').split('.');
    return { collection: collectionLabel(collection), name: rest.join('/') };
  });
}

/** The final raw value behind a variable in one mode, following every alias. */
export function rawValue(cssVar: string, theme: Theme, depth = 0): string {
  const value = declared[theme].get(cssVar) ?? declared.light.get(cssVar);
  if (!value || depth > 10) return '';
  const alias = value.match(/^var\((--ingrid-[\w-]+)\)$/)?.[1];
  if (alias) return rawValue(alias, theme, depth + 1);
  // Colour + opacity (translucent colours): "#000000 at 5%".
  const refs = [...value.matchAll(/var\((--ingrid-[\w-]+)\)/g)].map((m) => m[1] ?? '');
  if (value.startsWith('color-mix') && refs.length === 2) {
    const opacity = Number(rawValue(refs[1] ?? '', theme, depth + 1));
    return `${rawValue(refs[0] ?? '', theme, depth + 1)} at ${Math.round(opacity * 100)}%`;
  }
  return value;
}
