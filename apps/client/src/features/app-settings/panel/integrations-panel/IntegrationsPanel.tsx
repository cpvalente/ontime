import { Alert } from '@mantine/core';

import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import * as Panel from '../PanelUtils';

import HttpIntegrations from './HttpIntegrations';
import OscIntegrations from './OscIntegrations';
import { IoAlertCircleOutline } from '@react-icons/all-files/io5/IoAlertCircleOutline';

const integrationDocsUrl = 'https://docs.getontime.no/api/integrations/';

export default function IntegrationsPanel() {
  return (
    <>
      <Panel.Header>Integration settings</Panel.Header>
      <Panel.Section>
        <Alert color='blue' icon={<IoAlertCircleOutline />}>
          Integrations allow Ontime to receive commands or send its data to other systems in your workflow. <br />
          <br />
          Currently supported protocols are OSC (Open Sound Control), HTTP and Websockets. <br />
          WebSockets are used for Ontime and cannot be configured independently. <br />
          <ExternalLink href={integrationDocsUrl}>See the docs</ExternalLink>
        </Alert>
      </Panel.Section>
      <Panel.Section>
        <OscIntegrations />
        <HttpIntegrations />
      </Panel.Section>
    </>
  );
}
