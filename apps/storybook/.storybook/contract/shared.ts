// Shared by the Docs page section (ContractSection.tsx), the story side of the "Contract" tab
// (decorator.tsx) and the tab itself (Panel.tsx). No React, no DOM: plain contract logic.
import type { Contract, ContractRule } from '@updown/contracts';
import type { AliasRef } from '../token-value';

export type { Contract, ContractRule };

export const ADDON_ID = 'updown/contract';
export const PANEL_ID = `${ADDON_ID}/panel`;
/** Story -> tab: the bindings for the current combination, or null. */
export const RESULT_EVENT = `${ADDON_ID}/result`;
/** Tab -> story: "send me the current data". */
export const REQUEST_EVENT = `${ADDON_ID}/request`;

/**
 * Story parameters (set in the stories file's meta):
 *   contract: the component's <Name>.contract.json
 *   contractDocs: { anatomy: props for the anatomy drawing, selector: the component root }
 */
export type ContractDocsParameter = { anatomy?: Record<string, unknown>; selector?: string };
export type ContractParameters = { contract?: Contract; contractDocs?: ContractDocsParameter };

export const hasContract = (p?: ContractParameters) => !!p?.contract;

/** "Appearance" for a prop, "State" for state. */
export const axisName = (c: Contract, key: string) =>
  key === 'state' ? c.figma.stateProperty : (c.props[key]?.figma ?? key);

const values = (c: Contract, key: string): readonly string[] =>
  key === 'state' ? c.states : (c.props[key]?.values ?? []);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * A binding's `when` in plain words:
 *   { appearance: ['outlined'], state: [default, hovered, pressed, focused] } -> "Outlined · not disabled"
 */
export function whenText(c: Contract, when?: Readonly<Record<string, readonly string[]>>) {
  if (!when) return 'always';
  const parts: string[] = [];
  for (const [key, allowed] of Object.entries(when)) {
    const all = values(c, key);
    if (allowed.length >= all.length) continue;
    const excluded = all.filter((v) => !allowed.includes(v));
    parts.push(excluded.length < allowed.length ? `not ${excluded.join(' / ')}` : allowed.map(cap).join(' / '));
  }
  return parts.length ? parts.join(' · ') : 'always';
}

/** Whether a set of props falls under figma.lockLightMode (Ingrid: inverse sits on surface/inverse). */
export function isLockedLight(c: Contract, props: Record<string, unknown>) {
  const lock = c.figma.lockLightMode;
  if (!lock) return false;
  return Object.entries(lock).every(([key, vals]) => vals.includes(String(props[key] ?? c.props[key]?.default)));
}

/** Number of prop × state combinations the contract covers. */
export const combinationCount = (c: Contract) =>
  Object.values(c.props).reduce((n, p) => n * p.values.length, 1) * c.states.length;

/** The current combination from story args (defaults filled in) and a live state. */
export function comboFrom(c: Contract, args: Record<string, unknown>, state: string) {
  const combo: Record<string, string> = {};
  for (const [key, def] of Object.entries(c.props)) combo[key] = String(args[key] ?? def.default);
  combo.state = state;
  return combo;
}

export type ContractRow = {
  part: string;
  property: string;
  /** Token path (inputs.color.primary.filled.background) or text style name. */
  token: string;
  css?: string;
  textStyle?: string;
  /** Value in the current mode, when the component is on screen. */
  resolved?: string;
  /** What the token aliases (Figma variable names) and its final raw value, in the current mode. */
  alias?: AliasRef[];
  raw?: string;
  isColour?: boolean;
  /** true: the rendered component uses it; false: it doesn't; null: can't tell (part not rendered). */
  ok: boolean | null;
};

export type ContractResult = {
  name: string;
  combo: Record<string, string>;
  axes: { key: string; name: string; value: string }[];
  theme: string;
  rows: ContractRow[];
};
