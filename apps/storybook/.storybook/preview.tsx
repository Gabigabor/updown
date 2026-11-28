import type { Preview } from '@storybook/react-vite';
import { withTokenInspector } from './token-inspector/decorator';
import '@updown/tokens/tokens.css';
import '@updown/tokens/text-styles.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Colour mode (Colors collection)',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    // Feeds the Tokens tab on stories that set parameters.tokenInspector (inside the theme wrapper).
    withTokenInspector,
    (Story, { globals }) => (
      <div
        data-theme={globals.theme}
        style={{ background: 'var(--ingrid-color-surface-default)', padding: 'var(--ingrid-spacing-lg)', minHeight: '100%' }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    // Accessibility violations fail story tests (when the Vitest addon is added).
    a11y: { test: 'error' },
  },
};

export default preview;
