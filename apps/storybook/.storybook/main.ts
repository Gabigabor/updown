import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Stories live next to what they show: components in packages/react, token pages in packages/tokens.
  stories: ['../../../packages/*/src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  // GitHub Pages serves the site from /updown/.
  viteFinal: async (cfg, { configType }) =>
    configType === 'PRODUCTION' && process.env.STORYBOOK_BASE ? { ...cfg, base: process.env.STORYBOOK_BASE } : cfg,
};

export default config;
