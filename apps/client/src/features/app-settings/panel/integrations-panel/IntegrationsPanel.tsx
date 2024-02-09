import * as Panel from '../PanelUtils';

import HttpIntegrations from './HttpIntegrations';
import OscIntegrations from './OscIntegrations';

export const cycles = [
  { id: 1, label: 'On Load', value: 'onLoad' },
  { id: 2, label: 'On Start', value: 'onStart' },
  { id: 3, label: 'On Pause', value: 'onPause' },
  { id: 4, label: 'On Stop', value: 'onStop' },
  { id: 5, label: 'Every second', value: 'onUpdate' },
  { id: 6, label: 'On Finish', value: 'onFinish' },
];

export default function IntegrationsPanel() {
  return (
    <>
      <Panel.Header>Integration settings</Panel.Header>
      <OscIntegrations />
      <HttpIntegrations />
    </>
  );
}
