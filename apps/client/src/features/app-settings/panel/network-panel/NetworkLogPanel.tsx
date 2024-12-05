import { useEffect } from 'react';

import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { usePing } from '../../../../common/hooks/useSocket';
import { socketSendJson } from '../../../../common/utils/socket';
import { isDockerImage } from '../../../../externals';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import ClientControlPanel from '../client-control-panel/ClientControlPanel';

import InfoNif from './NetworkInterfaces';
import LogExport from './NetworkLogExport';

export default function NetworkLogPanel({ location }: PanelBaseProps) {
  const clientsRef = useScrollIntoView<HTMLDivElement>('clients', location);
  const logRef = useScrollIntoView<HTMLDivElement>('log', location);

  return (
    <>
      <Panel.Header>Network</Panel.Header>
      <Panel.Section>
        {isDockerImage && <OntimeCloudStats />}
        <Panel.Paragraph>Ontime is streaming on the following network interfaces</Panel.Paragraph>
      </Panel.Section>
      <InfoNif />
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
    socketSendJson('ping', new Date());

    const doPing = setInterval(() => {
      socketSendJson('ping', new Date());
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
