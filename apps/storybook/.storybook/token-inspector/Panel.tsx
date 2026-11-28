// The "Tokens" tab in Storybook's add-on panel (next to Controls and Actions).
// It only displays what the story side sends; the token lookup runs in the story (decorator.tsx).
import React, { useEffect, useState } from 'react';
import { useChannel } from 'storybook/manager-api';
import { useTheme } from 'storybook/theming';
import { withPx } from '../units';
import { TokenValueView } from '../token-value';
import { GROUPS, REQUEST_EVENT, RESULT_EVENT, type TokenResult } from './shared';

const checker = 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 10px 10px';

export function TokensPanel() {
  const theme = useTheme();
  const [data, setData] = useState<TokenResult | null>(null);
  const [copied, setCopied] = useState('');
  const emit = useChannel({ [RESULT_EVENT]: (result: TokenResult | null) => setData(result) });

  // The story may have rendered before this tab opened: ask for the current data.
  useEffect(() => {
    emit(REQUEST_EVENT);
  }, []);

  const copy = (s: string) => {
    navigator.clipboard?.writeText(s).catch(() => {});
    setCopied(s);
    setTimeout(() => setCopied((c) => (c === s ? '' : c)), 1200);
  };

  const rule = theme.appBorderColor;
  const muted = theme.textMutedColor;
  const mono: React.CSSProperties = { fontFamily: theme.typography.fonts.mono, fontSize: 12 };
  const cell: React.CSSProperties = { padding: '6px 10px', borderTop: `1px solid ${rule}`, verticalAlign: 'middle' };
  const head: React.CSSProperties = { ...cell, borderTop: 'none', textAlign: 'left', fontWeight: 700, color: muted, fontSize: 12 };

  if (!data) {
    return <p style={{ padding: 16, color: muted, fontSize: 13 }}>No component to inspect in this story.</p>;
  }

  return (
    <div style={{ padding: '12px 16px 24px', fontSize: 13, color: theme.color.defaultText }}>
      <p style={{ margin: '0 0 8px', color: muted, fontSize: 12 }}>
        State: <b style={{ color: theme.color.defaultText }}>{data.state}</b> · Mode:{' '}
        <b style={{ color: theme.color.defaultText }}>{data.theme}</b>. Updates as you change Controls, hover, press or
        tab to the component. Click a token to copy it; hover a row to see the CSS rule that sets it.
      </p>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ ...head, width: 40 }} />
            <th style={head}>Property</th>
            <th style={head}>Token</th>
            <th style={head}>Value ({data.theme})</th>
          </tr>
        </thead>
        {GROUPS.map((group) => {
          const rows = data.rows.filter((r) => r.group === group);
          if (!rows.length) return null;
          return (
            <tbody key={group}>
              <tr>
                <td colSpan={4} style={{ ...cell, fontWeight: 700, paddingTop: 14, borderTop: 'none' }}>
                  {group}
                </td>
              </tr>
              {rows.map((r) => (
                <tr key={r.prop} title={`Set by: ${r.selector}`} style={{ opacity: r.active === false ? 0.55 : 1 }}>
                  <td style={cell}>
                    {r.isColour && (
                      <div style={{ width: 24, height: 24, borderRadius: 4, background: checker, overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', background: r.resolved, boxShadow: `inset 0 0 0 1px ${rule}` }} />
                      </div>
                    )}
                  </td>
                  <td style={cell}>
                    {r.label}
                    {r.active && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          padding: '1px 6px',
                          borderRadius: 999,
                          background: theme.color.secondary,
                          color: theme.color.lightest,
                        }}
                      >
                        active
                      </span>
                    )}
                  </td>
                  <td style={{ ...cell, ...mono }}>
                    {r.tokens.length ? (
                      r.tokens.map((t) => (
                        <button
                          key={t.name}
                          onClick={() => copy(`var(${t.name})`)}
                          style={{ all: 'unset', ...mono, cursor: 'pointer', display: 'block' }}
                        >
                          {copied === `var(${t.name})` ? 'Copied!' : t.name}
                        </button>
                      ))
                    ) : (
                      <span style={{ color: muted }}>{r.value} (no token)</span>
                    )}
                  </td>
                  <td style={cell}>
                    {r.tokens.length ? (
                      <div style={{ display: 'grid', gap: 6 }}>
                        {r.tokens.map((t) => (
                          <TokenValueView key={t.name} alias={t.alias} raw={t.raw || r.resolved} subtle={muted} />
                        ))}
                      </div>
                    ) : (
                      <span style={mono}>{withPx(r.resolved)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
