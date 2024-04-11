import * as Panel from '../PanelUtils';

import LogExport from './LogExport';
import InfoNif from './NetworkInterfaces';

export default function LogPanel() {
  return (
    <>
      <Panel.Header>Log</Panel.Header>
      <Panel.Section>
        <Panel.Paragraph>Ontime is streaming on the following network interfaces</Panel.Paragraph>
      </Panel.Section>
      <InfoNif />
      <LogExport />
    </>
  );
}
