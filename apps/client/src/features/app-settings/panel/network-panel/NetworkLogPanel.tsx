import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { usePing } from '../../../../common/hooks/useSocket';
import { isDocker } from '../../../../externals';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import ClientControlPanel from './client-control/ClientControlPanel';
import LogExport from './NetworkLogExport';

export default function NetworkLogPanel({ location }: PanelBaseProps) {
  const clientsRef = useScrollIntoView<HTMLDivElement>('clients', location);
  const logRef = useScrollIntoView<HTMLDivElement>('log', location);

  return (
    <>
      <Panel.Header>Network</Panel.Header>
      {isDocker && (
        <Panel.Section>
          <OntimeCloudStats />
        </Panel.Section>
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

  return (
    <Panel.SubHeader>
      Ontime cloud
      <Panel.Description>Current ping: {Math.round(ping)}ms</Panel.Description>
    </Panel.SubHeader>
  );
}
