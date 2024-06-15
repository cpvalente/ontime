import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { PanelBaseProps } from '../../settingsStore';
import ClientControlPanel from '../client-control-panel/ClientControlPanel';
import * as Panel from '../PanelUtils';

import InfoNif from './NetworkInterfaces';
import LogExport from './NetworkLogExport';

export default function NetworkLogPanel({ location }: PanelBaseProps) {
  const clientsRef = useScrollIntoView<HTMLDivElement>('clients', location);
  const logRef = useScrollIntoView<HTMLDivElement>('log', location);

  return (
    <>
      <Panel.Header>Network</Panel.Header>
      <Panel.Section>
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
