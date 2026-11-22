# updown

A code-first design system proof of concept. **Code is the source of truth**: tokens, components and their contracts live here, and the Figma library is generated from them.

```
packages/tokens/src/ingrid.tokens.json ──▶ tokens.css, text-styles.css, tokens.js   (pnpm tokens)
                     │
packages/react/src/<Name>/
  <Name>.contract.ts  ──▶ packages/contracts/dist/contracts.json                    (pnpm contracts)
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

Requires Node 22.18 or later (contracts are TypeScript files that Node loads directly) and pnpm 10.

## Packages

| Path | What it is |
| --- | --- |
| `packages/tokens` | `@updown/tokens`: the token JSON in the [Ingrid variable format](https://github.com/Gabigabor/InGrid/blob/main/docs/variable-taxonomy.md) (621 tokens, 15 text styles), its build and its validator. |
| `packages/contracts` | `@updown/contracts`: the contract schema and the validator that writes `contracts.json`. |
| `packages/react` | `@updown/react`: components on [React Aria Components](https://react-spectrum.adobe.com/react-aria/), styled only with tokens. |
| `apps/storybook` | Storybook 10: component stories, foundation pages generated from the tokens, Light/Dark toolbar. |
| `scripts/check-css-tokens.mjs` | Fails on raw values or non-category tokens in component CSS. |
| `.claude/skills` | Claude skills: `ds-add-token`, `ds-new-component`. |

## The checks

| Command | Fails when |
| --- | --- |
| `pnpm tokens` | A token has no valid code syntax, two share a CSS name, or an alias is broken. |
| `pnpm tokens:validate` | A token breaks the taxonomy: missing description, scopes or mode; `ALL_SCOPES`; a raw value above the primitive tier; an alias that skips a tier; a text style not bound to Typography. Contrast below 4.5:1 is a warning. |
| `pnpm contracts` | A contract binding points at a missing token, two bindings collide, a binding never applies, the CSS Module uses a token the contract doesn't list (or misses one it does), or the stories lack `Playground` / `AllStates`. |
| `pnpm lint:css` | Component CSS has raw values, primitives or non-category semantic tokens. |

## Roadmap

1. **Foundations** (this): tokens, contracts, Storybook, CI, first skills, Button as the reference.
2. **Components:** 8–10 components with contracts and stories; `ds-write-stories` skill; visual and a11y tests.
3. **Figma pipeline:** Ingrid sync plugin (variables from the JSON), `ds-sync-figma` skill (component sets from contracts), drift check.
4. **Pilot:** build a sample screen; measure; decide.

Plan: [Code-First Design System — Plan](https://claude.ai/artifact/NZis8ckqVtP5b1JvG6hZhv).
