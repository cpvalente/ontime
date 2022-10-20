import { useState } from 'react';

import CollapseBar from '../../common/components/collapseBar/CollapseBar';
import useInfo from '../../common/hooks-query/useInfo';
import { openLink } from '../../common/utils/linkUtils';

import style from './Info.module.scss';

export default function InfoNif() {
  const { data, status } = useInfo();
  const [collapsed, setCollapsed] = useState(false);
  const baseURL = 'http://__IP__:4001';

  return (
    <div className={style.container}>
      <CollapseBar
        title='Network Info'
        isCollapsed={collapsed}
        onClick={() => setCollapsed((c) => !c)}
      />
      {!collapsed && (status === 'success') &&(
        <div className={style.interfaceList}>
          {data?.networkInterfaces.map((e) => (
            <a
              key={e.address}
              href='#!'
              onClick={() => openLink(baseURL.replace('__IP__', e.address))}
              className={style.interface}
            >
              {`${e.name} - ${e.address}`}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
