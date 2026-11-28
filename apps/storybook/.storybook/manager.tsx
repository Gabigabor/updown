import React from 'react';
import { addons, types } from 'storybook/manager-api';
import { AddonPanel } from 'storybook/internal/components';
import { TokensPanel } from './token-inspector/Panel';
import { ADDON_ID, PANEL_ID, isTokenInspectorOff } from './token-inspector/shared';
import { ContractPanel } from './contract/Panel';
import { ADDON_ID as CONTRACT_ADDON_ID, PANEL_ID as CONTRACT_PANEL_ID } from './contract/shared';

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

// "Contract" tab: what the contract says for the current combination, checked against the CSS.
// Shown only on stories whose meta sets parameters.contract.
addons.register(CONTRACT_ADDON_ID, () => {
  addons.add(CONTRACT_PANEL_ID, {
    type: types.PANEL,
    title: 'Contract',
    disabled: (parameters) => !parameters?.contract,
    render: ({ active }) => (
      <AddonPanel active={!!active}>
        <ContractPanel />
      </AddonPanel>
    ),
  });
});
