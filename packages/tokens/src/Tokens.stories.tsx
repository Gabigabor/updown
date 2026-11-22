// Storybook pages for browsing every Ingrid token. Everything is read from the generated
// dist files, so these pages always match src/ingrid.tokens.json (run `pnpm tokens`).
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokens, textStyles } from '../dist/tokens.js';
import { declared, shortValue } from '../../../apps/storybook/.storybook/tokens-css';

const PREFIX = '--ingrid-';

type Token = { path: string; cssVar: string; group: string; name: string };

const allTokens: Token[] = Object.entries(tokens).map(([path, ref]) => {
  const parts = path.split('.');
  return {
    path,
    cssVar: ref.slice(4, -1), // "var(--x)" -> "--x"
    group: parts.slice(1, -1).join(' / ') || parts[0],
    name: parts[parts.length - 1],
  };
});

const text = {
  default: 'var(--ingrid-color-surface-on-surface-default)',
  subtle: 'var(--ingrid-color-surface-on-surface-subtle)',
};
const rule = 'color-mix(in srgb, currentColor 15%, transparent)';
const checker =
  'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 12px 12px';

function Preview({ token, value }: { token: Token; value: string }) {
  const v = `var(${token.cssVar})`;
  const n = token.cssVar;
  const box: React.CSSProperties = { width: 40, height: 40, borderRadius: 6 };

  if (n.includes('font-family')) return <span style={{ fontFamily: v, fontSize: 20 }}>Aa</span>;
  if (n.includes('font-weight')) return <span style={{ fontWeight: v as never, fontSize: 20 }}>Aa</span>;
  if (n.includes('font-size')) return <span style={{ fontSize: v, lineHeight: 1 }}>Aa</span>;
  if (n.includes('letter-spacing')) return <span style={{ letterSpacing: v }}>Spacing</span>;
  if (n.includes('line-height')) return null;
  if (value && CSS.supports('color', value) && !/^[\d.]+$/.test(value)) {
    return (
      <div style={{ ...box, background: checker, boxShadow: `inset 0 0 0 1px ${rule}`, overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', background: v, boxShadow: `inset 0 0 0 1px ${rule}` }} />
      </div>
    );
  }
  if (n.includes('opacity') && /^[\d.]+$/.test(value)) {
    return <div style={{ ...box, background: text.default, opacity: v as never }} />;
  }
  if (n.includes('radius') && value.endsWith('px')) {
    return <div style={{ ...box, borderRadius: `min(${v}, 20px)`, border: `2px solid ${text.subtle}` }} />;
  }
  if (/^-?[\d.]+px$/.test(value)) {
    return (
      <div
        style={{ height: 12, width: `min(${v}, 240px)`, minWidth: 1, background: 'var(--ingrid-color-primary-default)', borderRadius: 2 }}
      />
    );
  }
  return null;
}

/** Reads each variable's resolved value from the page, inside the current theme. */
function useResolved(list: Token[], theme: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  useLayoutEffect(() => {
    if (!ref.current) return;
    const style = getComputedStyle(ref.current);
    setValues(Object.fromEntries(list.map((t) => [t.cssVar, style.getPropertyValue(t.cssVar).trim()])));
  }, [list, theme]);
  return [ref, values] as const;
}

function TokenTable({ collection, theme, modes }: { collection: string; theme: string; modes?: boolean }) {
  const [query, setQuery] = useState('');
  const list = useMemo(() => allTokens.filter((t) => t.path.startsWith(`${collection}.`)), [collection]);
  const [ref, resolved] = useResolved(list, theme);
  const [copied, setCopied] = useState('');

  const shown = list.filter((t) => `${t.path} ${t.cssVar}`.toLowerCase().includes(query.toLowerCase()));
  const groups = [...new Set(shown.map((t) => t.group))];

  const copy = (s: string) => {
    navigator.clipboard?.writeText(s).catch(() => {});
    setCopied(s);
    setTimeout(() => setCopied((c) => (c === s ? '' : c)), 1200);
  };

  const cell: React.CSSProperties = { padding: '8px 12px', borderTop: `1px solid ${rule}`, verticalAlign: 'middle' };
  const head: React.CSSProperties = { ...cell, borderTop: 'none', textAlign: 'left', fontWeight: 600, color: text.subtle, fontSize: 12 };
  const mono: React.CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 };

  return (
    <div ref={ref} style={{ color: text.default, fontFamily: 'system-ui, sans-serif', fontSize: 14 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filter ${list.length} tokens…`}
          style={{ padding: '6px 10px', minWidth: 240, font: 'inherit', color: 'inherit', background: 'transparent', border: `1px solid ${rule}`, borderRadius: 6 }}
        />
        <span style={{ color: text.subtle, fontSize: 12 }}>
          {modes ? `Showing ${theme} mode. Switch with the theme button in the toolbar. ` : ''}Click a variable to copy it.
        </span>
      </div>
      {groups.map((group) => (
        <section key={group} style={{ marginBottom: 32 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, textTransform: 'capitalize' }}>{group}</h3>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...head, width: 72 }} />
                <th style={head}>Token</th>
                <th style={head}>CSS variable</th>
                {modes ? (
                  <>
                    <th style={head}>Light</th>
                    <th style={head}>Dark</th>
                  </>
                ) : (
                  <th style={head}>Value</th>
                )}
                <th style={head}>Resolved{modes ? ` (${theme})` : ''}</th>
              </tr>
            </thead>
            <tbody>
              {shown
                .filter((t) => t.group === group)
                .map((t) => {
                  const light = declared.light.get(t.cssVar);
                  const dark = declared.dark.get(t.cssVar) ?? light;
                  return (
                    <tr key={t.path}>
                      <td style={cell}>
                        <Preview token={t} value={resolved[t.cssVar] ?? ''} />
                      </td>
                      <td style={cell}>{t.name}</td>
                      <td style={cell}>
                        <button
                          onClick={() => copy(`var(${t.cssVar})`)}
                          title="Copy var()"
                          style={{ all: 'unset', ...mono, cursor: 'pointer' }}
                        >
                          {copied === `var(${t.cssVar})` ? 'Copied!' : t.cssVar}
                        </button>
                      </td>
                      {modes ? (
                        <>
                          <td style={{ ...cell, ...mono, fontWeight: theme === 'light' ? 600 : 400 }}>{shortValue(light)}</td>
                          <td style={{ ...cell, ...mono, fontWeight: theme === 'dark' ? 600 : 400 }}>{shortValue(dark)}</td>
                        </>
                      ) : (
                        <td style={{ ...cell, ...mono }}>{shortValue(light)}</td>
                      )}
                      <td style={{ ...cell, ...mono, color: text.subtle }}>{resolved[t.cssVar]}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

function PrimitivePalette() {
  const list = useMemo(() => allTokens.filter((t) => t.path.startsWith('primitives.color.')), []);
  const [ref, resolved] = useResolved(list, 'light');
  const ramps = [...new Set(list.map((t) => t.group))];
  return (
    <div ref={ref} style={{ color: text.default, fontFamily: 'system-ui, sans-serif' }}>
      {ramps.map((ramp) => (
        <section key={ramp} style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 14, textTransform: 'capitalize' }}>
            {ramp === 'color' ? 'Base' : ramp.replace('color / ', '')}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {list
              .filter((t) => t.group === ramp)
              .map((t) => (
                <div key={t.path} title={`var(${t.cssVar})`} style={{ width: 84 }}>
                  <div style={{ height: 48, borderRadius: 6, background: checker, overflow: 'hidden', boxShadow: `inset 0 0 0 1px ${rule}` }}>
                    <div style={{ height: '100%', background: `var(${t.cssVar})`, boxShadow: `inset 0 0 0 1px ${rule}` }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: text.subtle, fontFamily: 'ui-monospace, Menlo, monospace' }}>
                    {resolved[t.cssVar]}
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TextStyleList() {
  return (
    <div style={{ color: text.default, display: 'grid', gap: 20 }}>
      {Object.entries(textStyles).map(([name, className]) => (
        <div key={name} style={{ borderBottom: `1px solid ${rule}`, paddingBottom: 16 }}>
          <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, color: text.subtle, marginBottom: 6 }}>
            {name} · .{className}
          </div>
          <div className={className}>The quick brown fox jumps over the lazy dog</div>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: 'Tokens',
  parameters: { layout: 'fullscreen', controls: { disable: true }, actions: { disable: true } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const table = (collection: string, modes = false): Story => ({
  render: (_, { globals }) => <TokenTable collection={collection} theme={globals.theme ?? 'light'} modes={modes} />,
});

export const ColorPalette: Story = { name: 'Primitives: Colour palette', render: () => <PrimitivePalette /> };
export const Primitives: Story = { name: 'Primitives: All', ...table('primitives') };
export const Colors: Story = { name: 'Colors (light / dark)', ...table('colors', true) };
export const Sizes: Story = table('sizes');
export const Opacity: Story = table('opacity');
export const Typography: Story = table('typography');
export const TextStyles: Story = { name: 'Text styles', render: () => <TextStyleList /> };
export const Inputs: Story = { name: 'Inputs', ...table('inputs', true) };
