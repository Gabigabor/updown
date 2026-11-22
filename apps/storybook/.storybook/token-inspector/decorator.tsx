// Story side of the "Tokens" tab (ported from Ingrid): works out which tokens the rendered component is using
// right now (current props, interaction state and colour mode) and sends them to the tab.
//
// The browser only exposes final values (#7fbd00), so the token names come from the CSS rules
// themselves: we find every rule that matches the element, pick the winning declaration the way
// the cascade does (specificity, then source order) and read the var(--ingrid-…) it points to.
import React, { useLayoutEffect, useRef } from 'react';
import type { Decorator } from '@storybook/react-vite';
import { addons } from 'storybook/preview-api';
import { aliasChain, shortValue, type Theme } from '../tokens-css';
import {
  REQUEST_EVENT,
  RESULT_EVENT,
  isTokenInspectorOff,
  type TokenInspectorParameter,
  type TokenResult,
  type TokenRow,
} from './shared';

type Declaration = { prop: string; value: string; selector: string; specificity: number; order: number };

const STATE_PROPS: Record<string, string> = {
  '--_hover': 'data-hovered',
  '--_pressed': 'data-pressed',
  '--_focus': 'data-focus-visible',
};
const LABELS: Record<string, string> = {
  '--_bg': 'Background',
  '--_border': 'Border',
  '--_label': 'Label colour',
  '--_hover': 'Hover overlay',
  '--_pressed': 'Pressed overlay',
  '--_focus': 'Focus overlay',
  '--_padding-x': 'Horizontal padding',
  '--_border-width': 'Border width',
  '--_icon': 'Icon size',
  outline: 'Focus ring',
  'outline-offset': 'Focus ring offset',
};
// Plumbing that only points at other private properties (the overlay shows whichever of
// --_hover / --_pressed / --_focus is active), so it carries no token of its own.
const SKIP = new Set(['--_overlay']);

const label = (prop: string) =>
  LABELS[prop] ?? prop.replace(/^--_/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** (ids, classes/attributes/pseudo-classes, types) packed into one comparable number. */
function specificity(selector: string) {
  const s = selector.replace(/::[\w-]+/g, '');
  const ids = (s.match(/#[\w-]+/g) ?? []).length;
  const classes = (s.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+/g) ?? []).length;
  const types = (s.replace(/\[[^\]]*\]/g, '').match(/(^|[\s>+~(])[a-z][\w-]*/gi) ?? []).length;
  return ids * 1e6 + classes * 1e3 + types;
}

function matchesSelector(el: Element, selector: string) {
  try {
    return el.matches(selector);
  } catch {
    return false; // pseudo-elements and selectors the browser can't test
  }
}

function winningDeclarations(el: Element) {
  const winners = new Map<string, Declaration>();
  let order = 0;

  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        order++;
        const matching = rule.selectorText.split(',').map((s) => s.trim()).filter((s) => matchesSelector(el, s));
        if (!matching.length) continue;
        const spec = Math.max(...matching.map(specificity));
        for (const [, prop, raw] of rule.style.cssText.matchAll(/([\w-]+)\s*:\s*([^;]+)/g)) {
          const value = raw.replace(/\s*!important\s*$/, '').trim();
          if (SKIP.has(prop) || (!prop.startsWith('--_') && !value.includes('var(--ingrid-'))) continue;
          const current = winners.get(prop);
          if (!current || spec > current.specificity || (spec === current.specificity && order >= current.order)) {
            winners.set(prop, { prop, value, selector: matching.join(', '), specificity: spec, order });
          }
        }
      } else if (rule instanceof CSSMediaRule) {
        if (window.matchMedia(rule.conditionText).matches) visit(rule.cssRules);
      } else if (rule instanceof CSSSupportsRule) {
        visit(rule.cssRules);
      }
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      visit(sheet.cssRules);
    } catch {
      // cross-origin stylesheet: not readable, and not ours
    }
  }
  return winners;
}

const isColour = (v: string) => !!v && !/^-?[\d.]+(px)?$/.test(v) && CSS.supports('color', v);

function inspect(el: Element, theme: Theme): TokenResult {
  const style = getComputedStyle(el);
  const rows: TokenRow[] = [];
  for (const d of winningDeclarations(el).values()) {
    const names = [...d.value.matchAll(/var\((--ingrid-[\w-]+)\)/g)].map((m) => m[1]);
    const resolved = d.prop.startsWith('--_')
      ? style.getPropertyValue(d.prop).trim()
      : names.length === 1
        ? style.getPropertyValue(names[0]).trim()
        : style.getPropertyValue(d.prop).trim();
    const colour = isColour(resolved);
    rows.push({
      label: label(d.prop),
      prop: d.prop,
      tokens: names.map((name) => ({ name, pointsTo: aliasChain(name, theme).map((c) => shortValue(`var(${c})`)) })),
      value: d.value,
      resolved,
      isColour: colour,
      selector: d.selector,
      group:
        d.prop in STATE_PROPS
          ? 'States'
          : /font|line-height|letter/.test(d.prop)
            ? 'Typography'
            : colour || d.prop === 'outline'
              ? 'Colour'
              : 'Size & spacing',
      active: d.prop in STATE_PROPS ? el.hasAttribute(STATE_PROPS[d.prop]) : undefined,
    });
  }
  const states = ['disabled', 'pressed', 'hovered', 'focus-visible'].filter((s) => el.hasAttribute(`data-${s}`));
  return { rows, state: states.length ? states.join(' + ') : 'default', theme };
}

function Inspector({ selector, theme, children }: { selector: string; theme: Theme; children: React.ReactNode }) {
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
        channel.emit(RESULT_EVENT, el ? inspect(el, theme) : null);
      });
    };
    send();
    // Props, hover/press/focus and disabled all show up as attribute changes on the element.
    const observer = new MutationObserver(send);
    observer.observe(root, { attributes: true, childList: true, subtree: true });
    channel.on(REQUEST_EVENT, send);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      channel.off(REQUEST_EVENT, send);
    };
  }, [selector, theme]);

  return <div ref={ref}>{children}</div>;
}

/** Global decorator: active only on stories that set `parameters.tokenInspector.selector`. */
export const withTokenInspector: Decorator = (Story, context) => {
  const parameters = context.parameters as { tokenInspector?: TokenInspectorParameter };
  if (isTokenInspectorOff(parameters)) return <Story />;
  const theme: Theme = context.globals.theme === 'dark' ? 'dark' : 'light';
  return (
    <Inspector selector={parameters.tokenInspector!.selector!} theme={theme}>
      <Story />
    </Inspector>
  );
};
