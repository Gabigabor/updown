// Shared between the story side (which reads the tokens) and the "Tokens" tab (which shows them).

export const ADDON_ID = 'ingrid/token-inspector';
export const PANEL_ID = `${ADDON_ID}/panel`;
/** Story -> tab: the latest token data, or null when the story has nothing to inspect. */
export const RESULT_EVENT = `${ADDON_ID}/result`;
/** Tab -> story: "send me the current data" (the tab can open after the story rendered). */
export const REQUEST_EVENT = `${ADDON_ID}/request`;

/**
 * Story parameter that turns the tab on:
 *   parameters: { tokenInspector: { selector: '.ingrid-button' } }
 * and off for one story: { tokenInspector: { disable: true } }
 */
export type TokenInspectorParameter = { selector?: string; disable?: boolean };

export const GROUPS = ['Colour', 'States', 'Size & spacing', 'Typography'] as const;

export type TokenRow = {
  label: string;
  prop: string;
  /** var(--ingrid-…) names in the winning declaration, each with its alias chain in the current mode. */
  tokens: { name: string; pointsTo: string[] }[];
  /** The declaration as written, shown when no token is used (e.g. "transparent"). */
  value: string;
  resolved: string;
  isColour: boolean;
  selector: string;
  group: (typeof GROUPS)[number];
  /** For state overlays: whether that state is on right now. */
  active?: boolean;
};

export type TokenResult = { rows: TokenRow[]; state: string; theme: string };

export const isTokenInspectorOff = (p?: { tokenInspector?: TokenInspectorParameter }) =>
  !p?.tokenInspector?.selector || !!p.tokenInspector.disable;
