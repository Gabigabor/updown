import type { Decorator, Preview } from '@storybook/react-vite';
import '@updown/tokens/tokens.css';
import '@updown/tokens/text-styles.css';
import './preview.css';

// Light / Dark from the toolbar. The theme is set on a wrapper, exactly as an app would.
const withTheme: Decorator = (Story, context) => (
  <div data-theme={context.globals.theme ?? 'light'} className="updown-canvas">
    <Story />
  </div>
);

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Colors mode',
      toolbar: {
        title: 'Theme',
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
  decorators: [withTheme],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    // Accessibility violations fail story tests (when the Vitest addon is added).
    a11y: { test: 'error' },
  },
};

export default preview;
