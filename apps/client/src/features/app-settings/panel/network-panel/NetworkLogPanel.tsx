import { MessageTag } from 'ontime-types';
import { useEffect } from 'react';

import Tag from '../../../../common/components/tag/Tag';
import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { usePing } from '../../../../common/hooks/useSocket';
import { sendSocket } from '../../../../common/utils/socket';
import { isDocker, isOntimeCloud } from '../../../../externals';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import ClientControlPanel from './client-control/ClientControlPanel';
import InfoNif from './NetworkInterfaces';
import LogExport from './NetworkLogExport';

/** ping values above this are flagged to the user (ms) */
const slowPingThreshold = 100;

export default function NetworkLogPanel({ location }: PanelBaseProps) {
  const interfacesRef = useScrollIntoView<HTMLDivElement>('interfaces', location);
  const clientsRef = useScrollIntoView<HTMLDivElement>('clients', location);
  const logRef = useScrollIntoView<HTMLDivElement>('log', location);

  return (
    <>
      <Panel.Header>Network</Panel.Header>
      {isDocker && <OntimeCloudStats />}
      {!isOntimeCloud && (
        <div ref={interfacesRef}>
          <Panel.Section>
            <Panel.Card>
              <Panel.SubHeader>Network interfaces</Panel.SubHeader>
              <Panel.Divider />
              <Panel.Paragraph>
                Addresses which can be used to reach Ontime from other devices in the network. <br />
                Click an address to open it in a new window, or use the icon to copy it to the clipboard.
              </Panel.Paragraph>
              <InfoNif />
            </Panel.Card>
          </Panel.Section>
        </div>
      )}
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
        <Panel.ListGroup>
          <Panel.ListItem>
            <Panel.Field
              title='Connection to the cloud server'
              description='Time for a message to travel to the server and back. Lower is better'
            />
            <Tag variant={ping > slowPingThreshold ? 'warning' : 'default'}>{ping}ms</Tag>
          </Panel.ListItem>
        </Panel.ListGroup>
      </Panel.Card>
    </Panel.Section>
  );
}
