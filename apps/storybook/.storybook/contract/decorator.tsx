// Story side of the "Contract" tab: for the current props and the live interaction state, looks
// up what the contract says each part should use (contracts.json), then checks the rendered
// component against it (the CSS rules that actually apply) and sends both to the tab.
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { Decorator } from '@storybook/react-vite';
import { addons } from 'storybook/preview-api';
import { textStyles } from '@updown/tokens';
import contractsData from '../../../../packages/contracts/dist/contracts.json';
import { winningDeclarations } from '../token-inspector/decorator';
import { aliasRefs, rawValue, type Theme } from '../tokens-css';
import { REQUEST_EVENT, RESULT_EVENT, axisName, comboFrom, hasContract, type Contract, type ContractParameters, type ContractResult, type ContractRow } from './shared';

type Binding = { part: string; property: string; token?: string; css?: string; textStyle?: string };
type Cell = { combo: Record<string, string>; bindings: Binding[] };
const built = (contractsData as unknown as { contracts: { name: string; matrix: Cell[] }[] }).contracts;

/** The contract state the element is in right now (React Aria's data attributes). */
function liveState(el: Element, c: Contract) {
  const order: [string, string][] = [
    ['data-disabled', 'disabled'],
    ['data-pressed', 'pressed'],
    ['data-hovered', 'hovered'],
    ['data-focus-visible', 'focused'],
  ];
  const hit = order.find(([attr, state]) => el.hasAttribute(attr) && c.states.includes(state));
  return hit ? hit[1] : 'default';
}

function check(el: Element, c: Contract, args: Record<string, unknown>, theme: string): ContractResult | null {
  const combo = comboFrom(c, args, liveState(el, c));
  const cell = built.find((b) => b.name === c.name)?.matrix.find((m) => Object.entries(combo).every(([k, v]) => m.combo[k] === v));
  if (!cell) return null;

  // Every --ingrid- token the CSS really applies, on the root and on each marked part.
  const parts = new Map<string, Element>([[c.anatomy[0] ?? 'container', el]]);
  el.querySelectorAll('[data-part]').forEach((p) => parts.set(p.getAttribute('data-part') ?? '', p));
  const used = new Set<string>();
  for (const node of parts.values()) {
    for (const d of winningDeclarations(node).values()) {
      for (const m of d.value.matchAll(/var\((--ingrid-[\w-]+)\)/g)) used.add(m[1] ?? '');
    }
  }

  const style = getComputedStyle(el);
  const rows: ContractRow[] = cell.bindings.map((b) => {
    if (b.textStyle) {
      const className = (textStyles as Record<string, string>)[b.textStyle];
      const target = parts.get(b.part);
      const ok = target ? !!className && (target.closest(`.${className}`) !== null || target.classList.contains(className)) : null;
      return { part: b.part, property: b.property, token: b.textStyle, textStyle: b.textStyle, ok };
    }
    const css = b.css ?? '';
    const resolved = style.getPropertyValue(css).trim();
    const mode: Theme = theme === 'dark' ? 'dark' : 'light';
    return {
      part: b.part,
      property: b.property,
      token: b.token ?? '',
      css,
      resolved,
      alias: aliasRefs(css, mode),
      raw: rawValue(css, mode),
      isColour: !!resolved && !/^-?[\d.]+(px|rem)?$/.test(resolved) && CSS.supports('color', resolved),
      ok: parts.has(b.part) ? used.has(css) : null,
    };
  });

  return {
    name: c.name,
    combo,
    axes: Object.entries(combo).map(([key, value]) => ({ key, name: axisName(c, key), value })),
    theme,
    rows,
  };
}

function Watcher({ selector, contract, args, theme, children }: { selector: string; contract: Contract; args: Record<string, unknown>; theme: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const channel = addons.getChannel();
    let frame = 0;
    const send = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = root.querySelector(selector);
        channel.emit(RESULT_EVENT, el ? check(el, contract, args, theme) : null);
      });
    };
    send();
    const observer = new MutationObserver(send);
    observer.observe(root, { attributes: true, childList: true, subtree: true });
    channel.on(REQUEST_EVENT, send);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      channel.off(REQUEST_EVENT, send);
    };
  }, [selector, contract, args, theme]);
  return <div ref={ref}>{children}</div>;
}

/** Global decorator: active on story pages whose meta sets parameters.contract. */
export const withContract: Decorator = (Story, context) => {
  const parameters = context.parameters as ContractParameters & { tokenInspector?: { selector?: string } };
  const selector = parameters.contractDocs?.selector ?? parameters.tokenInspector?.selector;
  if (context.viewMode !== 'story' || !hasContract(parameters) || !selector) return <Story />;
  return (
    <Watcher selector={selector} contract={parameters.contract!} args={context.args} theme={String(context.globals.theme ?? 'light')}>
      <Story />
    </Watcher>
  );
};
