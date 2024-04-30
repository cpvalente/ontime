import * as Panel from '../PanelUtils';

import ClientList from './ClientList';

export default function ClientControlPanel() {
  return (
    <Panel.Section>
      <Panel.Card>
        <Panel.SubHeader>Manage clients</Panel.SubHeader>
        <Panel.Divider />
        <ClientList />
      </Panel.Card>
    </Panel.Section>
  );
}
