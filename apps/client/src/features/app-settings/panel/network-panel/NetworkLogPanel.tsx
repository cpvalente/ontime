import { MessageTag } from 'ontime-types';
import { useEffect } from 'react';

import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { usePing } from '../../../../common/hooks/useSocket';
import { sendSocket } from '../../../../common/utils/socket';
import { isDocker } from '../../../../externals';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import ClientControlPanel from './client-control/ClientControlPanel';
import NetworkAddresses from './NetworkAddresses';
import LogExport from './NetworkLogExport';
import ServerStatus from './ServerStatus';

export default function NetworkLogPanel({ location }: PanelBaseProps) {
  const addressRef = useScrollIntoView<HTMLDivElement>('address', location);
  const statusRef = useScrollIntoView<HTMLDivElement>('status', location);
  const clientsRef = useScrollIntoView<HTMLDivElement>('clients', location);
  const logRef = useScrollIntoView<HTMLDivElement>('log', location);

  return (
    <>
      <Panel.Header>Network</Panel.Header>
      <div ref={addressRef}>
        <NetworkAddresses />
      </div>
      <div ref={statusRef}>
        <ServerStatus />
      </div>
      {isDocker && <OntimeCloudStats />}
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
  const ping = usePing();

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
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Ontime cloud</Panel.SubHeader>
        <Panel.Divider />
        <Panel.Section>
          <Panel.Description>Current ping: {ping}ms</Panel.Description>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
