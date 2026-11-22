import type { Contract } from '@updown/contracts';

const ACTIVE = ['default', 'hovered', 'pressed', 'focused'] as const;
const INTERACTIVE = ['hovered', 'pressed', 'focused'] as const;
const NOT_INVERSE = ['primary', 'neutral', 'destructive'] as const;

export default {
  name: 'Button',
  status: 'beta',
  description: 'Starts an action. Hovered, Pressed and Focused come from React Aria, so they are states, not props.',
  category: 'inputs',
  anatomy: ['container', 'leading-icon', 'label', 'trailing-icon', 'state-overlay', 'focus-ring'],

  props: {
    appearance: { values: ['filled', 'outlined', 'text'], default: 'filled', figma: 'Appearance', description: 'Emphasis: Filled (highest), Outlined (medium), Text (lowest).' },
    variant: { values: ['primary', 'neutral', 'destructive', 'inverse'], default: 'primary', figma: 'Variant', description: 'Primary for the main action, Neutral for secondary actions, Destructive for actions that delete or can’t be undone, Inverse only on dark backgrounds (surface/inverse).' },
    size: { values: ['small', 'medium', 'large'], default: 'medium', figma: 'Size', description: 'Height: Small 24 px, Medium 32 px, Large 44 px.' },
  },
  states: ['default', 'hovered', 'pressed', 'focused', 'disabled'],
  stateTokenNames: { hovered: 'hover', pressed: 'pressed', focused: 'focus' },

  tokens: [
    // Size: the same for every colour.
    { part: 'container', property: 'height', token: 'size/{size}/height' },
    { part: 'container', property: 'padding-x', token: 'size/{size}/padding-x' },
    { part: 'container', property: 'gap', token: 'size/{size}/gap' },
    { part: 'container', property: 'corner-radius', token: 'size/border-radius' },
    { part: 'container', property: 'border-width', token: 'size/border-width', when: { appearance: ['outlined'] } },
    { part: 'leading-icon', property: 'size', token: 'size/{size}/icon-size' },
    { part: 'trailing-icon', property: 'size', token: 'size/{size}/icon-size' },
    { part: 'label', property: 'textStyle', token: 'Label/Small', when: { size: ['small'] } },
    { part: 'label', property: 'textStyle', token: 'Label/Medium', when: { size: ['medium'] } },
    { part: 'label', property: 'textStyle', token: 'Label/Large', when: { size: ['large'] } },

    // Colour, enabled.
    { part: 'container', property: 'background', token: 'color/{variant}/filled/background', when: { appearance: ['filled'], state: ACTIVE } },
    { part: 'container', property: 'border', token: 'color/{variant}/outlined/border', when: { appearance: ['outlined'], state: ACTIVE } },
    { part: 'label', property: 'color', token: 'color/{variant}/{appearance}/label', when: { state: ACTIVE } },
    { part: 'leading-icon', property: 'color', token: 'color/{variant}/{appearance}/label', when: { state: ACTIVE } },
    { part: 'trailing-icon', property: 'color', token: 'color/{variant}/{appearance}/label', when: { state: ACTIVE } },

    // State overlay. Dark containers (filled neutral, outlined and text inverse) use the inverse overlays.
    { part: 'state-overlay', property: 'fill', token: 'color/state/{state}', when: { state: INTERACTIVE, variant: ['primary', 'destructive'] } },
    { part: 'state-overlay', property: 'fill', token: 'color/state/{state}', when: { state: INTERACTIVE, variant: ['neutral'], appearance: ['outlined', 'text'] } },
    { part: 'state-overlay', property: 'fill', token: 'color/state/{state}', when: { state: INTERACTIVE, variant: ['inverse'], appearance: ['filled'] } },
    { part: 'state-overlay', property: 'fill', token: 'color/state/inverse/{state}', when: { state: INTERACTIVE, variant: ['neutral'], appearance: ['filled'] } },
    { part: 'state-overlay', property: 'fill', token: 'color/state/inverse/{state}', when: { state: INTERACTIVE, variant: ['inverse'], appearance: ['outlined', 'text'] } },

    // Focus ring: shared semantic tokens, drawn outside the border.
    { part: 'focus-ring', property: 'stroke', token: 'colors/focus-ring', when: { state: ['focused'] } },
    { part: 'focus-ring', property: 'stroke-width', token: 'sizes/focus-ring/width', when: { state: ['focused'] } },
    { part: 'focus-ring', property: 'offset', token: 'sizes/focus-ring/offset', when: { state: ['focused'] } },

    // Disabled: one 25 % treatment for every colour; inverse has its own.
    { part: 'container', property: 'background', token: 'color/disabled/background', when: { state: ['disabled'], appearance: ['filled'], variant: NOT_INVERSE } },
    { part: 'container', property: 'border', token: 'color/disabled/border', when: { state: ['disabled'], appearance: ['outlined'], variant: NOT_INVERSE } },
    { part: 'label', property: 'color', token: 'color/disabled/label', when: { state: ['disabled'], variant: NOT_INVERSE } },
    { part: 'container', property: 'background', token: 'color/inverse/disabled/background', when: { state: ['disabled'], appearance: ['filled'], variant: ['inverse'] } },
    { part: 'container', property: 'border', token: 'color/inverse/disabled/border', when: { state: ['disabled'], appearance: ['outlined'], variant: ['inverse'] } },
    { part: 'label', property: 'color', token: 'color/inverse/disabled/label', when: { state: ['disabled'], variant: ['inverse'] } },
  ],

  a11y: {
    role: 'button',
    requires: ['An accessible name: visible label, or aria-label when the button shows only an icon'],
    keyboard: ['Enter', 'Space'],
  },
  rules: {
    do: [
      'Use filled primary for the single main action in a view.',
      'Use destructive only for actions that delete or cannot be undone.',
      'Put inverse buttons only on surface/inverse backgrounds.',
    ],
    dont: [
      'Do not use more than one filled primary button in a group.',
      'Do not dim a disabled button with opacity; the disabled tokens already do it.',
      'Do not use inverse on normal surfaces; use primary or neutral.',
    ],
  },
  figma: {
    componentSet: 'Button',
    stateProperty: 'State',
    lockLightMode: { variant: ['inverse'] },
  },
  storybook: { title: 'Inputs/Button' },
} as const satisfies Contract;
