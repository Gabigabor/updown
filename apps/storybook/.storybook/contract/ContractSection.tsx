// "Contract" section of every component's Docs page, drawn from its <Name>.contract.json.
// Everything visual is the real component, rendered live, so the page can't fall out of date.
import { createElement, useLayoutEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { useOf } from '@storybook/addon-docs/blocks';
import contractsData from '../../../../packages/contracts/dist/contracts.json';
import { axisName, combinationCount, isLockedLight, whenText, type Contract, type ContractParameters, type ContractRule } from './shared';

type Render = (args: Record<string, unknown>) => ReactNode;
type Theme = 'light' | 'dark';

// ---- look (Ingrid tokens; the Docs page itself stays light) -----------------------------
const ink = 'var(--ingrid-color-surface-on-surface-default)';
const quiet = 'var(--ingrid-color-surface-on-surface-subtle)';
const line = 'var(--ingrid-color-border-subtle)';
const card: CSSProperties = { border: `1px solid ${line}`, borderRadius: 12, overflow: 'hidden', background: 'var(--ingrid-color-surface-default)' };
const h3: CSSProperties = { margin: '32px 0 12px', fontSize: 16, fontWeight: 600, color: ink };
const chip: CSSProperties = { display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'var(--ingrid-color-surface-muted)', fontFamily: 'ui-monospace, monospace', fontSize: 12, color: ink };
const badge = (n: number): ReactNode => (
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 11, background: 'var(--ingrid-color-primary-default)', color: 'var(--ingrid-color-primary-on-primary)', fontSize: 12, fontWeight: 600, flex: 'none' }}>{n}</span>
);

/** A stage for live examples: the chosen mode, or surface/inverse in Light for locked combinations. */
function Stage({ theme, inverse, height = 120, children }: { theme: Theme; inverse?: boolean; height?: number; children: ReactNode }) {
  return (
    <div
      data-theme={inverse ? 'light' : theme}
      style={{
        minHeight: height, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12, padding: 16,
        background: inverse ? 'var(--ingrid-color-surface-inverse)' : 'var(--ingrid-color-surface-muted)',
      }}
    >
      {children}
    </div>
  );
}

// ---- anatomy ----------------------------------------------------------------------------
type Callout = { n: number; part: string; bx: number; by: number; tx: number; ty: number };

function Anatomy({ contract, theme, children }: { contract: Contract; theme: Theme; children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const [callouts, setCallouts] = useState<Callout[]>([]);
  const height = 220;

  useLayoutEffect(() => {
    const root = stage.current;
    if (!root) return;
    const measure = () => {
      const box = root.getBoundingClientRect();
      const rectOf = (part: string) => {
        const el = root.querySelector(`[data-part="${part}"]`);
        const r = el?.getBoundingClientRect();
        return r && r.width > 0 ? r : null;
      };
      const container = rectOf(contract.anatomy[0] ?? 'container');
      const rows: { top: Callout[]; bottom: Callout[] } = { top: [], bottom: [] };
      const bigFractions = { top: [0.06, 0.94, 0.5], bottom: [0.94, 0.06, 0.5] };
      const bigUsed = { top: 0, bottom: 0 };
      contract.anatomy.forEach((part, i) => {
        const row = i % 2 === 0 ? 'top' : 'bottom';
        // Parts with no box of their own right now (e.g. the focus ring when not focused) are
        // shown just outside the container.
        let r = rectOf(part);
        if (!r && container) r = new DOMRect(container.left - 6, container.top - 6, container.width + 12, container.height + 12);
        if (!r) return;
        const big = container ? r.width >= container.width * 0.9 : false;
        const f = big ? (bigFractions[row][bigUsed[row]++ % 3] ?? 0.5) : 0.5;
        const tx = r.left - box.left + r.width * f;
        const ty = row === 'top' ? r.top - box.top + (big ? 3 : 0) : r.bottom - box.top - (big ? 3 : 0);
        rows[row].push({ n: i + 1, part, bx: tx, by: row === 'top' ? 18 : height - 18, tx, ty });
      });
      // Spread the badges of each row so they never overlap (at least 32 px apart).
      for (const row of [rows.top, rows.bottom]) {
        row.sort((a, b) => a.tx - b.tx);
        for (let i = 1; i < row.length; i++) {
          const prev = row[i - 1]!;
          const cur = row[i]!;
          cur.bx = Math.max(cur.bx, prev.bx + 32);
        }
        const overflow = (row.at(-1)?.bx ?? 0) - (box.width - 18);
        if (overflow > 0) row.forEach((c) => (c.bx -= overflow));
      }
      setCallouts([...rows.top, ...rows.bottom].sort((a, b) => a.n - b.n));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [contract, theme]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: 24, alignItems: 'center' }}>
      <div ref={stage} data-theme={theme} style={{ position: 'relative', height, borderRadius: 12, background: 'var(--ingrid-color-surface-muted)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ transform: 'scale(1.5)' }}>{children}</div>
        </div>
        <svg width="100%" height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }} aria-hidden="true">
          {callouts.map((c) => (
            <g key={c.part}>
              <line x1={c.bx} y1={c.by} x2={c.tx} y2={c.ty} stroke={quiet} strokeWidth={1} />
              <circle cx={c.tx} cy={c.ty} r={2.5} fill={quiet} />
            </g>
          ))}
        </svg>
        {callouts.map((c) => (
          <span key={c.part} style={{ position: 'absolute', left: c.bx - 11, top: c.by - 11 }}>{badge(c.n)}</span>
        ))}
      </div>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
        {contract.anatomy.map((part, i) => (
          <li key={part} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: ink }}>
            {badge(i + 1)}
            <code style={chip}>{part}</code>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---- do / don't -------------------------------------------------------------------------
function RuleCard({ rule, kind, contract, render, theme }: { rule: ContractRule; kind: 'do' | 'dont'; contract: Contract; render: Render; theme: Theme }) {
  const example = rule.example ?? [];
  const inverse =
    rule.background === 'inverse' ||
    (rule.background !== 'surface' && example.length > 0 && example.every((p) => isLockedLight(contract, p)));
  const ok = kind === 'do';
  return (
    <div style={card}>
      {example.length > 0 && (
        <Stage theme={theme} inverse={inverse}>
          {example.map((props, i) => (
            <span key={i}>{render(props)}</span>
          ))}
        </Stage>
      )}
      <div style={{ borderTop: `3px solid ${ok ? 'var(--ingrid-color-success-default)' : 'var(--ingrid-color-error-default)'}`, padding: '10px 14px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: ok ? 'var(--ingrid-color-success-default)' : 'var(--ingrid-color-error-default)' }}>
          {ok ? '✓ Do' : '✕ Don’t'}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: ink }}>{rule.text}</div>
      </div>
    </div>
  );
}

// ---- the section ------------------------------------------------------------------------
export function ContractSection() {
  const resolved = useOf('meta');
  const meta = (resolved.type === 'meta' ? resolved.csfFile.meta : {}) as {
    component?: ComponentType<Record<string, unknown>>;
    render?: (args: Record<string, unknown>, context: unknown) => ReactNode;
    args?: Record<string, unknown>;
    parameters?: ContractParameters;
  };
  const contract = meta.parameters?.contract;
  const [theme, setTheme] = useState<Theme>('light');
  if (!contract) return null;

  const base = meta.args ?? {};
  const render: Render = (props) => {
    const args = { ...base, ...props };
    if (meta.render) return meta.render(args, {});
    return meta.component ? createElement(meta.component, args) : null;
  };
  const built = (contractsData as unknown as { contracts: { name: string; resolvedTokens: Record<string, string> }[] }).contracts.find((c) => c.name === contract.name);
  const tokenCount = built ? Object.keys(built.resolvedTokens).length : undefined;
  const anatomyNumber = (part: string) => contract.anatomy.indexOf(part) + 1;

  const toggle = (
    <div role="radiogroup" aria-label="Examples colour mode" style={{ display: 'inline-flex', border: `1px solid ${line}`, borderRadius: 8, overflow: 'hidden' }}>
      {(['light', 'dark'] as const).map((t) => (
        <button
          key={t}
          role="radio"
          aria-checked={theme === t}
          onClick={() => setTheme(t)}
          style={{ border: 0, padding: '4px 12px', fontSize: 12, cursor: 'pointer', background: theme === t ? 'var(--ingrid-color-surface-muted)' : 'transparent', color: ink, fontWeight: theme === t ? 600 : 400 }}
        >
          {t === 'light' ? 'Light' : 'Dark'}
        </button>
      ))}
    </div>
  );

  return (
    <section className="sb-unstyled" style={{ marginTop: 48, color: ink, fontFamily: 'var(--ingrid-font-family-sans)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderBottom: `1px solid ${line}`, paddingBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Contract</h2>
        <span style={{ padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'var(--ingrid-color-warning-subtle)', color: 'var(--ingrid-color-warning-on-warning-subtle)' }}>{contract.status}</span>
        <span style={{ fontSize: 13, color: quiet }}>
          category: {contract.category} · {combinationCount(contract)} combinations{tokenCount ? ` · ${tokenCount} tokens` : ''} · source: <code>{contract.name}.contract.json</code>
        </span>
        <span style={{ marginLeft: 'auto' }}>{toggle}</span>
      </div>

      {/* Do / Don't */}
      <h3 style={h3}>Usage</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'start' }}>
        {(['do', 'dont'] as const).map((kind) => (
          <div key={kind} style={{ display: 'grid', gap: 16 }}>
            {contract.rules[kind].map((rule, i) => (
              <RuleCard key={i} rule={rule} kind={kind} contract={contract} render={render} theme={theme} />
            ))}
          </div>
        ))}
      </div>

      {/* Anatomy */}
      <h3 style={h3}>Anatomy</h3>
      <Anatomy contract={contract} theme={theme}>
        {render({ ...(meta.parameters?.contractDocs?.anatomy ?? {}) })}
      </Anatomy>

      {/* Variants */}
      <h3 style={h3}>Variants</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {Object.entries(contract.props).map(([key, def]) => (
          <div key={key} style={card}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${line}` }}>
              <b style={{ fontSize: 13 }}>{def.figma}</b>
              <code style={{ fontSize: 12, color: quiet }}>{key}</code>
              {def.description && <span style={{ fontSize: 12, color: quiet }}>{def.description}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${def.values.length}, minmax(0, 1fr))` }}>
              {def.values.map((value) => (
                <div key={value} style={{ display: 'grid', gridTemplateRows: '1fr auto' }}>
                  <Stage theme={theme} inverse={isLockedLight(contract, { [key]: value })} height={96}>
                    {render({ [key]: value })}
                  </Stage>
                  <div style={{ padding: '6px 10px', fontSize: 12, textAlign: 'center', color: value === def.default ? ink : quiet, fontWeight: value === def.default ? 600 : 400 }}>
                    {value}
                    {value === def.default ? ' · default' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* States + accessibility */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
        <div>
          <h3 style={h3}>States</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {contract.states.map((s) => (
              <span key={s} style={chip}>{s}</span>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: quiet, lineHeight: 1.5 }}>
            States are not props: hover, press and keyboard focus come from React Aria. Try them on the examples above, and see each state’s tokens in the Contract tab.
          </p>
        </div>
        <div>
          <h3 style={h3}>Accessibility</h3>
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            <div>
              Role: <code style={chip}>{contract.a11y.role}</code>
            </div>
            <div>
              Keyboard:{' '}
              {contract.a11y.keyboard.map((k) => (
                <kbd key={k} style={{ ...chip, marginRight: 4, border: `1px solid ${line}` }}>{k}</kbd>
              ))}
            </div>
            {contract.a11y.requires.map((r) => (
              <div key={r}>Required: {r}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Tokens */}
      <h3 style={h3}>Tokens</h3>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: quiet }}>
        <code>{'{variant}'}</code>-style placeholders are filled from the current props; the Contract tab shows the exact tokens and values for one combination.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: quiet, fontSize: 12 }}>
            {['Part', 'Property', 'Token', 'When'].map((h) => (
              <th key={h} style={{ padding: '6px 8px', borderBottom: `1px solid ${line}`, fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contract.anatomy.flatMap((part) =>
            contract.tokens
              .filter((b) => b.part === part)
              .map((b, i) => (
                <tr key={`${part}-${i}`}>
                  <td style={{ padding: '6px 8px', borderBottom: `1px solid ${line}`, whiteSpace: 'nowrap' }}>
                    {i === 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {badge(anatomyNumber(part))}
                        {part}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '6px 8px', borderBottom: `1px solid ${line}` }}>{b.property}</td>
                  <td style={{ padding: '6px 8px', borderBottom: `1px solid ${line}` }}>
                    <code style={{ fontSize: 12 }}>{b.token}</code>
                  </td>
                  <td style={{ padding: '6px 8px', borderBottom: `1px solid ${line}`, color: quiet }}>{whenText(contract, b.when)}</td>
                </tr>
              )),
          )}
        </tbody>
      </table>
      <p style={{ marginTop: 8, fontSize: 12, color: quiet }}>Axes: {[...Object.keys(contract.props), 'state'].map((k) => axisName(contract, k)).join(' × ')}.</p>
    </section>
  );
}
