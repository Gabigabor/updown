# updown

A code-first design system proof of concept. **Code is the source of truth**: tokens, components and their contracts live here, and the Figma library is generated from them.

```
packages/tokens/src/ingrid.tokens.json ──▶ tokens.css, text-styles.css, tokens.js   (pnpm tokens)
                     │
packages/react/src/<Name>/
  <Name>.contract.json ──▶ packages/contracts/dist/contracts.json + <Name>.contract.d.json.ts (pnpm contracts)
  <Name>.tsx, <Name>.module.css, <Name>.stories.tsx ──▶ Storybook                   (pnpm storybook)
                     │
                     └──▶ Figma variables + component sets (Phase 3: sync plugin + Claude skill)
```

## Quick start

```sh
pnpm install
pnpm check        # tokens + taxonomy + contracts + component CSS (no dependencies needed)
pnpm storybook
```

Requires Node 22 or later and pnpm 10.

## Packages

| Path | What it is |
| --- | --- |
| `packages/tokens` | `@updown/tokens`: the token JSON in the [Ingrid variable format](https://github.com/Gabigabor/InGrid/blob/main/docs/variable-taxonomy.md) (621 tokens, 15 text styles), its build and its validator. |
| `packages/contracts` | `@updown/contracts`: the contract types, `contract.schema.json` (editor checks for `*.contract.json`), and the validator that writes `contracts.json` and each contract's generated `.d.json.ts` types. |
| `packages/react` | `@updown/react`: components on [React Aria Components](https://react-spectrum.adobe.com/react-aria/), styled only with tokens. |
| `apps/storybook` | Storybook 10 config: Light/Dark toolbar; a **Tokens** tab next to Controls that shows which token is behind each property of the selected component; a **Contract** section on every Docs page (usage do/don'ts with live examples, anatomy drawing, variants, states, accessibility, tokens) and a **Contract** tab that checks the current combination against the CSS. Stories live next to their code: `packages/*/src/**/*.stories.tsx`. |
| `scripts/check-css-tokens.mjs` | Fails on raw values or non-category tokens in component CSS. |
| `.claude/skills` | Claude skills: `ds-add-token`, `ds-new-component`. |

## The checks

| Command | Fails when |
| --- | --- |
| `pnpm tokens` | Builds the CSS: sizes and letter spacing are px in the JSON (as in Figma) and become rem (16px = 1rem). Fails when a token has no valid code syntax, two share a CSS name, or an alias is broken. |
| `pnpm tokens:validate` | A token breaks the taxonomy: missing description, scopes or mode; `ALL_SCOPES`; a raw value above the primitive tier; an alias that skips a tier; a text style not bound to Typography. Contrast below 4.5:1 is a warning. |
| `pnpm contracts` | A contract isn't valid JSON or has an unknown field, an anatomy part isn't marked with `data-part` in the component, a rule example uses an invalid prop value, a binding points at a missing token, two bindings collide, a binding never applies, the CSS Module uses a token the contract doesn't list (or misses one it does), or the stories lack `Playground` or a title matching the contract. |
| `pnpm lint:css` | Component CSS has raw values, primitives or non-category semantic tokens. |

## Roadmap

1. **Foundations** (this): tokens, contracts, Storybook, CI, first skills, Button as the reference.
2. **Components:** 8–10 components with contracts and stories; `ds-write-stories` skill; visual and a11y tests.
3. **Figma pipeline:** Ingrid sync plugin (variables from the JSON), `ds-sync-figma` skill (component sets from contracts), drift check.
4. **Pilot:** build a sample screen; measure; decide.

Plan: [Code-First Design System — Plan](https://claude.ai/artifact/NZis8ckqVtP5b1JvG6hZhv).
