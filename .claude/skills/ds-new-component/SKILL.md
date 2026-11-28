---
name: ds-new-component
description: Use when creating a new component in packages/react. Writes the contract first, then the React Aria component, its CSS Module (tokens only) and its stories, and runs every check.
---

# Create a component

Code is the source of truth, and the contract is the component's specification. Write it
first; the component, CSS, stories and later the Figma component set all follow from it.
Use `packages/react/src/button/` as the reference for every file.

## 1. Agree the definition (ask, don't guess)

1. **Category collection.** List the category collections in `packages/tokens/src/ingrid.tokens.json`
   (today: `inputs`) and ask which one the component belongs to, or whether it needs a new one.
2. **Anatomy:** named parts (container, label, icons, indicator, helper text…). These become Figma layer names.
3. **Variant props.** Reuse Ingrid's names where they fit: `appearance` (filled, outlined, text),
   `variant` (primary, neutral, destructive, inverse), `size` (small, medium, large).
4. **States:** default, hovered, pressed, focused, disabled (plus selected, invalid… if needed).
5. **The React Aria component** it builds on (Button, Checkbox, Switch, TextField, Select…).

## 2. Token plan

Write a table: part · property · token template · exists? Cover every colour (background,
border, label, icon), every size (height, padding, gap, icon size, radius, border width),
the text style, state overlays, disabled and the focus ring. Reuse tokens wherever the role
fits. Missing ones go through the `ds-add-token` skill. Show the plan and wait for approval.

## 3. Files (in this order)

`packages/react/src/<kebab-name>/`:

1. **`<Name>.contract.json`**: start with
   `"$schema": "../../../contracts/contract.schema.json"` so the editor checks it, and keep the
   layout of `Button.contract.json` (short lists and each token binding on one line). Every
   binding uses `when` to say which combinations it applies to. Only category tokens, text styles and the shared `colors/focus-ring`,
   `sizes/focus-ring/width` and `sizes/focus-ring/offset` are allowed. Run `pnpm contracts`:
   it validates the file and generates `<Name>.contract.d.json.ts` (commit it, never edit it).
2. **`<Name>.tsx`**: wraps the React Aria component. Prop types and defaults come from the
   contract (`import contract from './<Name>.contract.json'`,
   `PropValue<typeof contract, 'size'>`, `contract.props.size.default`). Props
   reach CSS as `data-*` attributes; React Aria adds `data-hovered`, `data-pressed`,
   `data-focus-visible`, `data-disabled`. The label gets the text-style class from
   `textStyles` in `@updown/tokens`. Inverse variants set `data-theme="light"`.
3. **`<Name>.module.css`**: only `var(--ingrid-…)` tokens that the contract lists, and every
   one of them. No raw values. State overlays on a `::before` layer, focus ring as an outline
   outside the border, disabled through the disabled tokens (never opacity).
4. **`<Name>.stories.tsx`**, laid out like `Button.stories.tsx`:
   - meta with `tags: ['autodocs']`, so the Docs page (live example, Show code, property
     table) is the component's main page;
   - controls named after the Figma property names in the contract (`contract.props.x.figma`),
     plus Label, icon switches and Disabled, listed in `parameters.controls.include`;
     descriptions from the contract, ending with ``Prop: `name`.``;
   - `parameters.tokenInspector.selector` set to the component's root, for the Tokens tab;
   - an inverse decorator that puts inverse variants on `surface/inverse` in Light mode;
   - `Playground` with `tags: ['!dev']` (shown on the Docs page only);
   - one story per appearance (`Filled`, `Outlined`, `Text`), each a single component set
     only through `args`, so it uses the meta defaults (primary) and works with Controls;
   - `AllVariants` (every appearance × variant × size, plus disabled), `tags: ['!autodocs']`
     with the token inspector disabled. The meta `title` must be a string literal equal to
   `contract.storybook.title` (Storybook can't read a variable there; `pnpm contracts` checks it).
5. Export it from `packages/react/src/index.ts`.

## 4. Check

```sh
pnpm check       # tokens, taxonomy, contracts (tokens ↔ CSS ↔ stories), component CSS
pnpm typecheck
pnpm storybook   # look at each story and AllVariants in Light and Dark; hover, press and tab
```

All must pass. In Storybook, check the a11y panel shows no violations and that focus rings
are whole.

## 5. Hand off

Report: files created, new tokens (if any), check results, and anything left open. Don't
touch Figma from this skill; that is `ds-sync-figma`'s job (Phase 3).
