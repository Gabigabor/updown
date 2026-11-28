/**
 * Component contract schema.
 *
 * A contract is one machine-readable file per component (Button.contract.ts) that says what
 * the component is, which props and states it has, and exactly which tokens each part uses
 * in each combination. TypeScript props say what compiles; the contract says what is correct.
 *
 * The same file feeds:
 *   - the component itself (prop types and defaults are derived from it),
 *   - packages/contracts/scripts/build.mjs (validation + contracts.json),
 *   - Storybook docs, the Figma generator and Claude skills.
 *
 * Write contracts as `export default { … } as const satisfies Contract;` and import only
 * types from this module, so Node can load the file directly (type stripping, Node ≥ 22.18).
 */

export type ContractStatus = 'alpha' | 'beta' | 'stable' | 'deprecated';

/** One variant property, e.g. appearance: filled | outlined | text. */
export interface VariantProp {
  values: readonly string[];
  default: string;
  /** Figma component property name, e.g. "Appearance". */
  figma: string;
  description?: string;
}

/**
 * One design value of one part.
 *
 * `token` is a token path with slashes:
 *   - relative to the contract's category collection: 'color/{variant}/{appearance}/label'
 *     → inputs.color.primary.filled.label
 *   - or absolute when it starts with a collection key: 'colors/focus-ring'
 *     (only the shared focus-ring tokens may be used this way)
 *   - or a text style name when property is 'textStyle': 'Label/Medium'
 *
 * `{prop}` placeholders are filled from the current combination; `{state}` too, after
 * renaming through `stateTokenNames`.
 *
 * `when` limits the binding to combinations whose values are all in the listed sets.
 */
export interface TokenBinding {
  part: string;
  property: string;
  token: string;
  when?: Readonly<Record<string, readonly string[]>>;
}

export interface Contract {
  name: string;
  status: ContractStatus;
  description: string;
  /** Token collection key of the component's category, e.g. 'inputs'. */
  category: string;
  /** Named layers. These become Figma layer names. */
  anatomy: readonly string[];
  props: Readonly<Record<string, VariantProp>>;
  /** Interaction states. 'default' first. In Figma they become the State property. */
  states: readonly string[];
  /** How state names appear inside token names, e.g. { hovered: 'hover' }. */
  stateTokenNames?: Readonly<Record<string, string>>;
  tokens: readonly TokenBinding[];
  a11y: {
    role: string;
    requires: readonly string[];
    keyboard: readonly string[];
  };
  rules: {
    do: readonly string[];
    dont: readonly string[];
  };
  figma: {
    componentSet: string;
    stateProperty: string;
    /** Combinations that keep the Light Colors mode in both themes (Ingrid: inverse). */
    lockLightMode?: Readonly<Record<string, readonly string[]>>;
  };
  storybook: {
    title: string;
  };
}

/** The value union of one variant prop of a contract: PropValue<typeof contract, 'size'>. */
export type PropValue<C extends Contract, K extends keyof C['props']> =
  C['props'][K]['values'][number];
