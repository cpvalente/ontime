import { useEffect } from 'react';
import { MessageType } from 'ontime-types';

import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { usePing } from '../../../../common/hooks/useSocket';
import { sendOntimeSocket } from '../../../../common/utils/socket';
import { isDockerImage, isOntimeCloud } from '../../../../externals';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import ClientControlPanel from '../client-control-panel/ClientControlPanel';

import GenerateLinkForm from './GenerateLinkForm';
import InfoNif from './NetworkInterfaces';
import LogExport from './NetworkLogExport';

export default function NetworkLogPanel({ location }: PanelBaseProps) {
  const linkRef = useScrollIntoView<HTMLDivElement>('link', location);
  const clientsRef = useScrollIntoView<HTMLDivElement>('clients', location);
  const logRef = useScrollIntoView<HTMLDivElement>('log', location);

  return (
    <>
      <Panel.Header>Network</Panel.Header>
      {isDockerImage && (
        <Panel.Section>
          <OntimeCloudStats />
        </Panel.Section>
      )}
      <div ref={linkRef}>
        <Panel.Section>
          <Panel.Card>
            <Panel.SubHeader>Share Ontime Link</Panel.SubHeader>
            <Panel.Divider />
            {!isOntimeCloud && (
              <>
                <Panel.Paragraph>Ontime is streaming on the following network interfaces</Panel.Paragraph>
                <InfoNif />
              </>
            )}
            <GenerateLinkForm />
          </Panel.Card>
        </Panel.Section>
      </div>
      <div ref={logRef}>
        <LogExport />
      </div>
      <div ref={clientsRef}>
        <ClientControlPanel />
      </div>
    </>
  );
}

function OntimeCloudStats() {
  const { ping } = usePing();

  /**
   * Send immediate ping request, and keep sending on an interval
   */
  useEffect(() => {
    sendOntimeSocket({ type: MessageType.Ping, payload: new Date() });

    const doPing = setInterval(() => {
      sendOntimeSocket({ type: MessageType.Ping, payload: new Date() });
    }, 5000);

    return () => {
      clearInterval(doPing);
    };
  }, []);

  return (
    <Panel.SubHeader>
      Ontime cloud
      <Panel.Description>Current ping: {ping}ms</Panel.Description>
    </Panel.SubHeader>
  );
}
