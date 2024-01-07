import * as Panel from '../PanelUtils';

import Log from './Log';
import InfoNif from './NetworkInterfaces';

export default function LogPanel() {
  return (
    <>
      <Panel.Header>Application log</Panel.Header>
      <Panel.Section>
        <Panel.SubHeader>Available networks</Panel.SubHeader>
        <Panel.Card>
          <Panel.Paragraph>Ontime is streaming on the following network interfaces</Panel.Paragraph>
          <InfoNif />
        </Panel.Card>
      </Panel.Section>

      <Panel.Section>
        <Panel.SubHeader>Network log</Panel.SubHeader>
        <Panel.Card>
          <Log />
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
