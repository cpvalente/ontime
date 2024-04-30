import { Button } from '@chakra-ui/react';

import useClientRemote from '../../../../common/hooks-query/useClientRemote';
import { useClientList } from '../../../../common/stores/clientList';
import * as Panel from '../PanelUtils';

import style from './ClientControlPanel.module.scss';

export default function ClientList() {
  const { self } = useClientList();
  const { data } = useClientRemote();

  return (
    <Panel.Table>
      <thead>
        <tr>
          <td className={style.fullWidth}>Client Name</td>
          <td />
        </tr>
      </thead>
      <tbody>
        {data.map((client) => {
          const isCurrent = client === self;
          return (
            <tr key={client} className={isCurrent ? style.current : undefined}>
              <td className={style.fullWidth}>{isCurrent ? `${client} (self)` : client}</td>
              <td className={style.actionButtons}>
                <Button size='xs' variant='ontime-subtle' isDisabled={isCurrent}>
                  Identify
                </Button>
                <Button size='xs' variant='ontime-subtle'>
                  Rename
                </Button>
                <Button size='xs' variant='ontime-subtle' isDisabled={isCurrent}>
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
