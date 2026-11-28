// One way to show a token's value everywhere in Storybook (Tokens pages, Tokens tab, Contract
// tab): the alias as its Figma variable name on top, the final raw value under it. A token
// with no alias (a primitive) shows its raw value only. No token-file imports here, so the
// add-on panels (which run outside the preview) can use it too.
// The add-on panels are built with the classic JSX transform, which needs React in scope.
import React, { type CSSProperties } from 'react';
import { withPx } from './units';

export type AliasRef = { collection: string; name: string };

const mono: CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 };

export function TokenValueView({ alias, raw, subtle }: { alias: AliasRef[]; raw: string; subtle: string }) {
  const rawText = withPx(raw);
  if (!alias.length) return <span style={mono}>{rawText}</span>;
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'baseline' }}>
        {alias.map((a, i) => (
          <span key={`${a.collection}/${a.name}`} style={{ display: 'inline-flex', gap: 4, alignItems: 'baseline' }}>
            {i > 0 && <span style={{ color: subtle }}>+</span>}
            <span style={{ fontSize: 11, color: subtle }}>{a.collection}</span>
            <span style={{ ...mono, fontWeight: 600 }}>{a.name}</span>
          </span>
        ))}
      </div>
      <span style={{ ...mono, fontSize: 11, color: subtle }}>{rawText}</span>
    </div>
  );
}
