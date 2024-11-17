import useScrollIntoView from '../../../../common/hooks/useScrollIntoView';
import { isOntimeCloud } from '../../../../externals';
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
        {isOntimeCloud && <Panel.SubHeader>Ontime cloud</Panel.SubHeader>}
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
