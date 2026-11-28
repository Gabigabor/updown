---
name: ds-add-token
description: Use when a component or design needs a token that doesn't exist yet (a colour, size, radius, spacing or type value). Adds it to packages/tokens/src/ingrid.tokens.json following the Ingrid taxonomy, then builds and validates.
---

# Add a token

The token JSON is the source of truth. Figma variables are generated from it later, so
everything Figma needs (collection, modes, scopes, code syntax, description) must be in the JSON.

The rules are the Ingrid taxonomy: https://github.com/Gabigabor/InGrid/blob/main/docs/variable-taxonomy.md.
`packages/tokens/scripts/validate.mjs` enforces the mechanical ones.

## 1. Check you really need one

- Read the category collection (e.g. `inputs`) and the semantic collections in the JSON.
- Reuse an existing token whenever its **role** fits, even if the name isn't perfect.
- Never add a token for a single component (`button/…`). Names describe a role inside any
  component of the category: `color/<variant>/<appearance>/<part>`, `size/<size>/<property>`.
- If the need is a one-off, say so and stop.

## 2. Pick the tier

| Need | Tier | Collection |
| --- | --- | --- |
| A raw value that doesn't exist yet | 1 | `primitives` (size steps follow px × 25; no alpha colours) |
| A new role (e.g. a new surface) | 2 | `colors`, `sizes`, `opacity` or `typography` |
| Something shared by a family of components | 3 | its category collection (`inputs`, …) |

Each tier aliases only the tier above it: semantic → primitives, category → semantic.
Ask the user before adding a primitive or a semantic token, or before creating a new category collection.

## 3. Write the token

Place it in the existing group order. Shape (example from Inputs):

```json
"background": {
  "$type": "color",
  "$value": "{colors.primary.default}",
  "$description": "Background of filled primary inputs. Pair with color/primary/filled/label.",
  "$extensions": {
    "com.figma": {
      "collection": "Inputs",
      "codeSyntax": { "WEB": "var(--ingrid-input-primary-filled-background)" },
      "scopes": ["FRAME_FILL"],
      "modes": { "Value": "{colors.primary.default}" }
    }
  }
}
```

- **modes:** one entry per mode of the collection. Colors needs both `Light` and `Dark`
  (follow the dark-mode rules in the taxonomy). `$value` equals the default mode's value.
- **codeSyntax.WEB:** `var(--ingrid-<name>)` with the collection's prefix rule
  (Colors: `--ingrid-color-…` with `semantic/` dropped; Inputs: `--ingrid-input-…` with
  `color/` and `size/` dropped). It must be unique. Never change an existing one without asking:
  it is a breaking change for code.
- **scopes:** from the taxonomy's scope table; primitives get `[]`; never `ALL_SCOPES`.
- **description:** where to use it and what it pairs with. Use ’ instead of '.
- Translucent colours: `{"color": "{primitives.color.black}", "opacity": "{primitives.opacity.5}"}`.

## 4. Build and check

```sh
pnpm tokens && pnpm tokens:validate
```

Both must pass. Read any contrast warning and report it; don't change other tokens to fix it.

## 5. Hand off

Report: token path → alias → CSS name, and which component will use it. If a component's
contract should use it, update the contract and run `pnpm contracts`.
