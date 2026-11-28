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
    (Story, { globals, viewMode }) => {
      // On a story page the whole canvas takes the theme, so Dark mode is dark edge to edge.
      // On Docs pages only the example boxes do, so the page text stays readable.
      const root = document.documentElement;
      if (viewMode === 'story') {
        root.setAttribute('data-theme', globals.theme);
        document.body.style.background = 'var(--ingrid-color-surface-default)';
      } else {
        root.removeAttribute('data-theme');
        document.body.style.background = '';
      }
      return (
        <div
          data-theme={globals.theme}
          style={{ background: 'var(--ingrid-color-surface-default)', padding: 'var(--ingrid-spacing-lg)' }}
        >
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    // Accessibility violations fail story tests (when the Vitest addon is added).
    a11y: { test: 'error' },
  },
};

export default preview;
