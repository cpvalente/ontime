import * as Panel from '../PanelUtils';

export default function ClientList() {
  return (
    <Panel.Table>
      <thead>
        <tr>
          <th>Client ID</th>
          <th>Client Name</th>
          <th />
        </tr>
      </thead>
      <tbody></tbody>
    </Panel.Table>
  );
}
