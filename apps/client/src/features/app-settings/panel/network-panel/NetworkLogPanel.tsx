import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { isOntimeCloud } from '../../../../externals';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import ClientControlPanel from './client-control/ClientControlPanel';
import InfoNif from './NetworkInterfaces';
import LogExport from './NetworkLogExport';
import NetworkStatus from './NetworkStatus';

export default function NetworkLogPanel({ location }: PanelBaseProps) {
  const statusRef = useScrollIntoView<HTMLDivElement>('status', location);
  const interfacesRef = useScrollIntoView<HTMLDivElement>('interfaces', location);
  const clientsRef = useScrollIntoView<HTMLDivElement>('clients', location);
  const logRef = useScrollIntoView<HTMLDivElement>('log', location);

  return (
    <>
      <Panel.Header>Network</Panel.Header>
      <div ref={statusRef}>
        <NetworkStatus />
      </div>
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
