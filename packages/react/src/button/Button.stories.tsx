import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { Button } from './Button.tsx';
import contract from './Button.contract.ts';

const { appearance, variant, size } = contract.props;

const meta = {
  // Storybook needs a string literal here; pnpm contracts checks it equals contract.storybook.title.
  title: 'Inputs/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Button' },
  argTypes: {
    appearance: { control: 'inline-radio', options: appearance.values, description: appearance.description, table: { defaultValue: { summary: appearance.default } } },
    variant: { control: 'inline-radio', options: variant.values, description: variant.description, table: { defaultValue: { summary: variant.default } } },
    size: { control: 'inline-radio', options: size.values, description: size.description, table: { defaultValue: { summary: size.default } } },
    isDisabled: { control: 'boolean' },
  },
  parameters: {
    docs: { description: { component: contract.description } },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const row: CSSProperties = { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' };
const inverseBg: CSSProperties = { background: 'var(--ingrid-color-surface-inverse)', padding: 16, borderRadius: 8 };

/** Every prop as a control. */
export const Playground: Story = {};

/** One row per appearance, every variant in it. Inverse sits on surface/inverse. */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      {appearance.values.map((a) => (
        <div key={a} style={row}>
          {variant.values.filter((v) => v !== 'inverse').map((v) => (
            <Button key={v} {...args} appearance={a} variant={v}>{`${a} ${v}`}</Button>
          ))}
          <div data-theme="light" style={inverseBg}>
            <Button {...args} appearance={a} variant="inverse">{`${a} inverse`}</Button>
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Small, medium and large, with icons. */
export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {size.values.map((s) => (
        <Button key={s} {...args} size={s} leadingIcon={<Plus />}>{s}</Button>
      ))}
    </div>
  ),
};

/**
 * The full contract matrix: appearance × variant × state at medium size. This is the visual
 * reference for the Figma component set (columns = State, as in Figma).
 * Hovered, Pressed and Focused are forced with a wrapper attribute; in use they come from React Aria.
 */
export const AllStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table style={{ borderCollapse: 'separate', borderSpacing: '16px 12px' }}>
      <thead>
        <tr>
          <th />
          {contract.states.map((s) => (
            <th key={s} className="ingrid-text-label-small" style={{ textAlign: 'left', color: 'var(--ingrid-color-surface-on-surface-subtle)' }}>{s}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {appearance.values.flatMap((a) =>
          variant.values.map((v) => {
            const inverse = v === 'inverse';
            return (
              <tr key={`${a}-${v}`} data-theme={inverse ? 'light' : undefined} style={inverse ? { background: 'var(--ingrid-color-surface-inverse)' } : undefined}>
                <th className="ingrid-text-label-small" style={{ textAlign: 'left', color: inverse ? 'var(--ingrid-color-surface-on-surface-inverse)' : 'var(--ingrid-color-surface-on-surface-subtle)' }}>{`${a} ${v}`}</th>
                {contract.states.map((s) => (
                  <td key={s}>
                    <span data-preview-state={s === 'disabled' || s === 'default' ? undefined : s} style={{ display: 'inline-block' }}>
                      <Button appearance={a} variant={v} isDisabled={s === 'disabled'} leadingIcon={<Plus />}>Button</Button>
                    </span>
                  </td>
                ))}
              </tr>
            );
          }),
        )}
      </tbody>
    </table>
  ),
};

/** Keyboard: Tab focuses the button, Enter and Space press it. */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button');
    if (!button) throw new Error('No button rendered');
    button.focus();
    if (document.activeElement !== button) throw new Error('Button did not take focus');
  },
};
