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
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const target = selector.includes('data-theme="dark"') ? dark : light;
    for (const [, name, value] of body.matchAll(/(--ingrid-[\w-]+)\s*:\s*([^;]+);/g)) {
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
