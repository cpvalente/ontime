import { Alert, AlertDescription, AlertIcon } from '@chakra-ui/react';

import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import * as Panel from '../PanelUtils';

import HttpIntegrations from './HttpIntegrations';
import OscIntegrations from './OscIntegrations';

const integrationDocsUrl = 'https://ontime.gitbook.io/v2/control-and-feedback/integrations';

export default function IntegrationsPanel() {
  return (
    <>
      <Panel.Header>Integration settings</Panel.Header>
      <Panel.Section>
        <Alert status='info' variant='ontime-on-dark-info'>
          <AlertIcon />
          <AlertDescription>
            Integrations allow Ontime to receive commands or send its data to other systems in your workflow. <br />
            <br />
            Currently supported protocols are OSC (Open Sound Control), HTTP and Websockets. <br />
            WebSockets are used for Ontime and cannot be configured independently. <br />
            <ExternalLink href={integrationDocsUrl}>See the docs</ExternalLink>
          </AlertDescription>
        </Alert>
      </Panel.Section>
      <Panel.Section>
        <OscIntegrations />
        <HttpIntegrations />
      </Panel.Section>
    </>
  );
}
