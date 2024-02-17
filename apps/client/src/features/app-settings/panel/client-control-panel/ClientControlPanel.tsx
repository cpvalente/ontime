import * as Panel from '../PanelUtils';

import ClientList from './ClientList';

export default function ClientControlPanel() {
  return (
    <>
      <Panel.Header>Client Control</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>Manage Clients</Panel.SubHeader>
          <ClientList />
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
