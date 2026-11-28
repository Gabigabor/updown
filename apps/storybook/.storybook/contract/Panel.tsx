// The "Contract" tab next to Controls and Tokens. It only displays what the story side sends
// (contract/decorator.tsx): the contract's tokens for the current combination, and whether the
// rendered component really uses them.
import React, { useEffect, useState } from 'react';
import { useChannel } from 'storybook/manager-api';
import { useTheme } from 'storybook/theming';
import { REQUEST_EVENT, RESULT_EVENT, type ContractResult } from './shared';

const checker = 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 10px 10px';

export function ContractPanel() {
  const theme = useTheme();
  const [data, setData] = useState<ContractResult | null>(null);
  const emit = useChannel({ [RESULT_EVENT]: (result: ContractResult | null) => setData(result) });
  useEffect(() => {
    emit(REQUEST_EVENT);
  }, []);

  const rule = theme.appBorderColor;
  const muted = theme.textMutedColor;
  const mono: React.CSSProperties = { fontFamily: theme.typography.fonts.mono, fontSize: 12 };
  const cell: React.CSSProperties = { padding: '6px 10px', borderTop: `1px solid ${rule}`, verticalAlign: 'middle' };
  const head: React.CSSProperties = { ...cell, borderTop: 'none', textAlign: 'left', fontWeight: 700, color: muted, fontSize: 12 };

  if (!data) {
    return <p style={{ padding: 16, color: muted, fontSize: 13 }}>No contract for this story. Open one of the component stories.</p>;
  }

  const checked = data.rows.filter((r) => r.ok !== null);
  const missing = checked.filter((r) => r.ok === false);
  const good = '#2e7d32';
  const bad = '#c62828';

  return (
    <div style={{ padding: '12px 16px 24px', fontSize: 13, color: theme.color.defaultText }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ color: muted, fontSize: 12, marginRight: 4 }}>{data.name} ·</span>
        {data.axes.map((a) => (
          <span key={a.key} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: theme.background.hoverable }}>
            {a.name}: <b>{a.value}</b>
          </span>
        ))}
        <span style={{ color: muted, fontSize: 12 }}>· mode: {data.theme}</span>
      </div>
      <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: missing.length ? bad : good }}>
        {missing.length
          ? `✕ The component doesn’t use ${missing.length} of the ${checked.length} tokens the contract lists for this combination.`
          : `✓ The component uses all ${checked.length} tokens the contract lists for this combination.`}
      </p>
      <p style={{ margin: '0 0 8px', color: muted, fontSize: 12 }}>
        Change Controls, or hover, press and tab to the component: the State follows it. The contract is{' '}
        <code style={mono}>{data.name}.contract.json</code>.
      </p>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={head}>Part</th>
            <th style={head}>Property</th>
            <th style={head}>Token</th>
            <th style={head}>Value ({data.theme})</th>
            <th style={{ ...head, width: 30 }} />
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={i}>
              <td style={cell}>{i === 0 || data.rows[i - 1]?.part !== r.part ? r.part : ''}</td>
              <td style={cell}>{r.property}</td>
              <td style={cell}>
                <code style={mono}>{r.css ?? r.textStyle}</code>
                {r.css && <div style={{ ...mono, fontSize: 11, color: muted }}>{r.token}</div>}
              </td>
              <td style={cell}>
                {r.isColour ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${rule}`, background: `linear-gradient(${r.resolved}, ${r.resolved}), ${checker}` }} />
                    <span style={mono}>{r.resolved}</span>
                  </span>
                ) : (
                  <span style={mono}>{r.resolved || (r.textStyle ? 'text style class' : '')}</span>
                )}
              </td>
              <td style={{ ...cell, fontWeight: 700, color: r.ok === null ? muted : r.ok ? good : bad }} title={r.ok === null ? 'This part isn’t rendered in this story' : r.ok ? 'Used by the CSS' : 'Not used by the CSS'}>
                {r.ok === null ? '–' : r.ok ? '✓' : '✕'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
