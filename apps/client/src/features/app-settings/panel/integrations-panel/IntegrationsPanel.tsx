import { Alert, AlertDescription, AlertIcon } from '@chakra-ui/react';

import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../PanelUtils';

import HttpIntegrations from './HttpIntegrations';
import OscIntegrations from './OscIntegrations';

const integrationDocsUrl = 'https://docs.getontime.no/api/integrations/';

export default function IntegrationsPanel({ location }: PanelBaseProps) {
  const oscRef = useScrollIntoView<HTMLDivElement>('osc', location);
  const httpRef = useScrollIntoView<HTMLDivElement>('http', location);

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
        <div ref={oscRef}>
          <OscIntegrations />
        </div>
        <div ref={httpRef}>
          <HttpIntegrations />
        </div>
      </Panel.Section>
    </>
  );
}
