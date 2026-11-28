import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { usePing } from '../../../../common/hooks/useSocket';
import { capabilities, isDocker } from '../../../../externals';
import type { PanelBaseProps } from '../../panel-list/PanelList';
import * as Panel from '../../panel-utils/PanelUtils';
import ClientControlPanel from './client-control/ClientControlPanel';
import LogExport from './NetworkLogExport';
import ServerPortSettings from './ServerPortSettings';

export default function ServerPanel({ location }: PanelBaseProps) {
  const clientsRef = useScrollIntoView<HTMLDivElement>('clients', location);
  const logRef = useScrollIntoView<HTMLDivElement>('log', location);

  return (
    <>
      <Panel.Header>Server</Panel.Header>
      {isDocker && (
        <Panel.Section>
          <OntimeCloudStats />
        </Panel.Section>
      )}
      <div ref={clientsRef}>
        {capabilities.canChangePort && <ServerPortSettings />}
        <ClientControlPanel />
      </div>
      <div ref={logRef}>
        <LogExport />
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
