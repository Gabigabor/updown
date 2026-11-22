import React from 'react';
import { addons, types } from 'storybook/manager-api';
import { AddonPanel } from 'storybook/internal/components';
import { TokensPanel } from './token-inspector/Panel';
import { ADDON_ID, PANEL_ID, isTokenInspectorOff } from './token-inspector/shared';

// "Tokens" tab next to Controls. Shown only on stories that set parameters.tokenInspector.selector.
addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Tokens',
    disabled: (parameters) => isTokenInspectorOff(parameters),
    render: ({ active }) => (
      <AddonPanel active={!!active}>
        <TokensPanel />
      </AddonPanel>
    ),
  });
});
