import { Button } from '@chakra-ui/react';

import { setClientIdentify } from '../../../../common/api/clientRemote';
import useClientRemote from '../../../../common/hooks-query/useClientRemote';
import { useClientStore } from '../../../../common/stores/clientStore';
import * as Panel from '../PanelUtils';

import style from './ClientControlPanel.module.scss';

export default function ClientList() {
  const { self, identify } = useClientStore();
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
          const isIdent = client in identify && identify[client];
          return (
            <tr key={client} className={isCurrent ? style.current : undefined}>
              <td className={style.fullWidth}>{isCurrent ? `${client} (self)` : client}</td>
              <td className={style.actionButtons}>
                <Button
                  size='xs'
                  className={`${isIdent ? style.blink : ''}`}
                  variant={isIdent ? 'ontime-filled' : 'ontime-subtle'}
                  isDisabled={isCurrent}
                  onClick={() => {
                    setClientIdentify(client, !isIdent);
                  }}
                  isActive
                >
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
