import { useEffect } from 'react';
import { Button } from '@chakra-ui/react';

import { getClientList } from '../../../../common/hooks/useSocket';
import { useClientList } from '../../../../common/stores/clientList';
import * as Panel from '../PanelUtils';

import style from './ClientControlPanel.module.scss';

export default function ClientList() {
  const { self, clients } = useClientList();

  // keep list of clients up to date
  useEffect(() => {
    getClientList();
  }, []);

  return (
    <Panel.Table>
      <thead>
        <tr>
          <td className={style.fullWidth}>Client Name</td>
          <td />
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => {
          const isCurrent = client === self;
          return (
            <tr key={client} className={isCurrent ? style.current : undefined}>
              <td className={style.fullWidth}>{client}</td>
              <td className={style.actionButtons}>
                <Button size='xs' variant='ontime-subtle' isDisabled={isCurrent}>
                  Identify
                </Button>
                <Button size='xs' variant='ontime-subtle'>
                  Rename
                </Button>
                <Button size='xs' variant='ontime-subtle'>
                  Redirect
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Panel.Table>
  );
}
