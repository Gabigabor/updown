import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import source from '@updown/tokens/ingrid.tokens.json';

// Foundation pages are generated from the token JSON, never hand-drawn,
// so a token change shows up here the moment the JSON changes.

interface Token {
  path: string;
  css: string;
  description: string;
  type: string;
}

const collect = (node: Record<string, unknown>, trail: string[] = [], out: Token[] = []): Token[] => {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$') || !value || typeof value !== 'object') continue;
    const v = value as Record<string, any>;
    if ('$value' in v) {
      out.push({
        path: [...trail, key].join('/'),
        css: String(v.$extensions['com.figma'].codeSyntax.WEB),
        description: String(v.$description ?? ''),
        type: String(v.$type),
      });
    } else collect(v, [...trail, key], out);
  }
  return out;
};

const tokens = collect(source as Record<string, unknown>);
const inCollection = (key: string) => tokens.filter((t) => t.path.startsWith(`${key}/`));

const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 };
const card: CSSProperties = { display: 'grid', gap: 4, alignContent: 'start' };
const quiet: CSSProperties = { color: 'var(--ingrid-color-surface-on-surface-subtle)' };

const Swatch = ({ t }: { t: Token }) => (
  <div style={card} title={t.description}>
    <div style={{ height: 48, borderRadius: 8, background: t.css, boxShadow: 'inset 0 0 0 1px var(--ingrid-color-border-subtle)' }} />
    <code className="ingrid-text-label-small">{t.path.replace(/^colors\//, '')}</code>
    <span className="ingrid-text-body-small" style={quiet}>{t.css.slice(4, -1)}</span>
  </div>
);

const Size = ({ t }: { t: Token }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'center' }} title={t.description}>
    <code className="ingrid-text-label-small">{t.path.replace(/^sizes\//, '')}</code>
    <div style={{ height: 12, width: t.css, minWidth: 1, background: 'var(--ingrid-color-primary-default)', borderRadius: 2 }} />
  </div>
);

const meta = {
  title: 'Foundations/Tokens',
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Semantic colours (Colors collection). Switch Light / Dark in the toolbar. */
export const Colors: Story = {
  render: () => (
    <div style={grid}>
      {inCollection('colors').filter((t) => t.type === 'color').map((t) => <Swatch key={t.path} t={t} />)}
    </div>
  ),
};

/** Spacing and dimension (Sizes collection). */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 8 }}>
      {inCollection('sizes').filter((t) => /\/(spacing|dimension)\//.test(t.path)).map((t) => <Size key={t.path} t={t} />)}
    </div>
  ),
};

/** The 15 text styles. */
export const TextStyles: Story = {
  render: () => {
    const styles = (source as any).$extensions['com.figma'].textStyles as { name: string; description?: string }[];
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        {styles.map((s) => (
          <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, alignItems: 'baseline' }}>
            <code className="ingrid-text-label-small" style={quiet}>{s.name}</code>
            <span className={`ingrid-text-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>The quick brown fox</span>
          </div>
        ))}
      </div>
    );
  },
};
