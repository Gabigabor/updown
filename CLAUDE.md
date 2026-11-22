# updown: working rules

Code-first design system POC. **Code is the source of truth; Figma is generated from it.**
Never treat Figma as an input: a difference between Figma and code is drift to fix in Figma.

## Where things are

- `packages/tokens/src/ingrid.tokens.json`: every token, in the Ingrid variable format
  (taxonomy: https://github.com/Gabigabor/InGrid/blob/main/docs/variable-taxonomy.md).
  `dist/` is generated; never edit it.
- `packages/contracts`: the contract schema (`src/index.ts`) and its validator.
- `packages/react/src/<component>/`: `<Name>.tsx`, `<Name>.module.css`, `<Name>.contract.ts`, `<Name>.stories.tsx`.
- `apps/storybook`: Storybook 10 config and foundation pages.
- `.claude/skills/`: `ds-add-token`, `ds-new-component`.

## Rules

- Components use only category tokens (e.g. `--ingrid-input-…`), text-style classes and the
  shared focus-ring tokens. No raw values, no primitives, no other semantic tokens.
- A component's CSS uses exactly the tokens its contract lists.
- Each token tier aliases only the tier above it. Every token carries scopes, WEB code
  syntax and a description, because Figma is rebuilt from the JSON alone.
- Never rename or delete a token, prop or variant without asking: both are breaking changes.
- Figma is on the Professional plan: no Variables REST API, no Code Connect. Figma writes go
  through the Plugin API only.

## Commands

```sh
pnpm check           # build tokens, validate taxonomy, validate contracts, check component CSS
pnpm typecheck
pnpm storybook       # http://localhost:6006
```

`pnpm check` needs no installed packages, so run it after every change.
