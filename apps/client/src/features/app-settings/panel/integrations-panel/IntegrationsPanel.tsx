import ExternalLink from '../../../../common/components/external-link/ExternalLink';
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

const integrationDocsUrl = 'https://ontime.gitbook.io/v2/control-and-feedback/integrations';

export default function IntegrationsPanel() {
  return (
    <>
      <Panel.Header>Integration settings</Panel.Header>
      <div>
        Some helpful tips
        <ExternalLink href={integrationDocsUrl}> in the docs</ExternalLink>
      </div>
      <OscIntegrations />
      <HttpIntegrations />
    </>
  );
}
