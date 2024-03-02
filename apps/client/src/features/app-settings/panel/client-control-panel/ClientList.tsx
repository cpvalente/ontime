import { useClientList } from '../../../../common/stores/clientList';
import * as Panel from '../PanelUtils';

export default function ClientList() {
  const { clients: clientData } = useClientList();

  console.log(clientData);

  return (
    <Panel.Table>
      <thead>
        <tr>
          <th>Client Name</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {clientData.map((clientData) => (
          // eslint-disable-next-line react/jsx-key
          <tr>
            <td>{clientData}</td>
          </tr>
        ))}
        <tr>
          <td>Client Name</td>
          <td>Client Action</td>
        </tr>
      </tbody>
    </Panel.Table>
  );
}
