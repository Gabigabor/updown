import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { Button } from './Button.tsx';
import contract from './Button.contract.ts';

const { appearance, variant, size } = contract.props;

const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/** Story-only switches: the icons themselves are fixed, the controls just turn them on or off. */
type ButtonStoryArgs = ComponentProps<typeof Button> & {
  showLeadingIcon?: boolean;
  showTrailingIcon?: boolean;
};

const union = (values: readonly string[]) => values.map((v) => `'${v}'`).join(' | ');

const meta = {
  // Storybook needs a string literal here; pnpm contracts checks it equals contract.storybook.title.
  title: 'Inputs/Button',
  component: Button,
  // Docs page: the live example with a "Show code" button, then the property table with controls.
  tags: ['autodocs'],
  // Inverse is shown on its dark background, locked to Light mode like the component itself.
  decorators: [
    (Story, { args }) =>
      args.variant === 'inverse' ? (
        <div data-theme="light" style={{ display: 'inline-block', padding: 16, background: 'var(--ingrid-color-surface-inverse)' }}>
          <Story />
        </div>
      ) : (
        <Story />
      ),
  ],
  args: {
    children: 'Button',
    appearance: appearance.default,
    variant: variant.default,
    size: size.default,
    showLeadingIcon: false,
    showTrailingIcon: false,
    isDisabled: false,
  },
  // Controls and the property table are listed in this order. Names are the Figma component
  // property names from the contract, so Storybook, code and Figma use the same words.
  argTypes: {
    children: {
      name: 'Label',
      control: 'text',
      description: 'Button text. Every button needs a label. Prop: `children`.',
      table: { type: { summary: 'ReactNode' } },
    },
    appearance: {
      name: appearance.figma,
      control: 'radio',
      options: appearance.values,
      description: `${appearance.description} Prop: \`appearance\`.`,
      table: { type: { summary: union(appearance.values) }, defaultValue: { summary: appearance.default } },
    },
    variant: {
      name: variant.figma,
      control: 'radio',
      options: variant.values,
      description: `${variant.description} Prop: \`variant\`.`,
      table: { type: { summary: union(variant.values) }, defaultValue: { summary: variant.default } },
    },
    size: {
      name: size.figma,
      control: 'radio',
      options: size.values,
      description: `${size.description} Prop: \`size\`.`,
      table: { type: { summary: union(size.values) }, defaultValue: { summary: size.default } },
    },
    showLeadingIcon: {
      name: 'Leading icon',
      control: 'boolean',
      description: 'Icon before the label. Prop: `leadingIcon` (any SVG, sized by the button).',
      table: { type: { summary: 'ReactNode' } },
    },
    showTrailingIcon: {
      name: 'Trailing icon',
      control: 'boolean',
      description: 'Icon after the label. Prop: `trailingIcon` (any SVG, sized by the button).',
      table: { type: { summary: 'ReactNode' } },
    },
    isDisabled: {
      name: 'Disabled',
      control: 'boolean',
      description: 'Uses the shared 25% disabled colours and ignores presses. Prop: `isDisabled`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    leadingIcon: { table: { disable: true } },
    trailingIcon: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        component: `${contract.description} Every colour and size comes from the Inputs tokens; the full specification is \`Button.contract.ts\`.`,
      },
    },
    // Tokens tab next to Controls: which token is behind each property of the button.
    tokenInspector: { selector: 'button[data-appearance]' },
    controls: {
      include: ['Label', appearance.figma, variant.figma, size.figma, 'Leading icon', 'Trailing icon', 'Disabled'],
    },
  },
  render: ({ showLeadingIcon, showTrailingIcon, leadingIcon, trailingIcon, ...args }) => (
    <Button
      {...args}
      leadingIcon={showLeadingIcon ? <Plus /> : leadingIcon}
      trailingIcon={showTrailingIcon ? <Plus /> : trailingIcon}
    />
  ),
} satisfies Meta<ButtonStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Shown at the top of the Docs page; hidden from the sidebar, because the Docs page replaces it. */
export const Playground: Story = { tags: ['!dev'] };

/** Highest emphasis: the main action in a view. Change Variant in Controls for the other colours. */
export const Filled: Story = { args: { appearance: 'filled' } };

/** Medium emphasis: secondary actions next to a filled button. */
export const Outlined: Story = { args: { appearance: 'outlined' } };

/** Lowest emphasis: tertiary actions and actions inside dense layouts. */
export const Text: Story = { args: { appearance: 'text' } };

/** Every Appearance × Variant × Size, like the Figma component set. Inverse sits on the inverse surface. */
export const AllVariants: Story = {
  // Its own sidebar page, but not on the Docs page.
  tags: ['!autodocs'],
  parameters: { tokenInspector: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      {appearance.values.map((a) => (
        <div key={a} style={{ display: 'grid', gap: 8 }}>
          {variant.values.map((v) => (
            <div
              key={v}
              data-theme={v === 'inverse' ? 'light' : undefined}
              style={{
                display: 'flex', gap: 12, alignItems: 'center', padding: 8,
                background: v === 'inverse' ? 'var(--ingrid-color-surface-inverse)' : undefined,
              }}
            >
              {size.values.map((s) => (
                <Button key={s} appearance={a} variant={v} size={s} leadingIcon={<Plus />} trailingIcon={<Plus />}>
                  Button
                </Button>
              ))}
              {size.values.map((s) => (
                <Button key={`d-${s}`} appearance={a} variant={v} size={s} isDisabled>
                  Disabled
                </Button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};
