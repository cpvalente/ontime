import { useEffect } from 'react';
import { MessageTag } from 'ontime-types';

import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { usePing } from '../../../../common/hooks/useSocket';
import { sendSocket } from '../../../../common/utils/socket';
import { isDockerImage, isOntimeCloud } from '../../../../externals';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import ClientControlPanel from '../client-control-panel/ClientControlPanel';

import GenerateLinkFormExport from './GenerateLinkFormExport';
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
            <GenerateLinkFormExport />
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
    sendSocket(MessageTag.Ping, new Date());

    const doPing = setInterval(() => {
      sendSocket(MessageTag.Ping, new Date());
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
