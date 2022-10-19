import { useState } from 'react';

import CollapseBar from '../../common/components/collapseBar/CollapseBar';
import useInfo from '../../common/hooks/useInfo';
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
        <div>
          {data?.networkInterfaces.map((e) => (
            <a
              key={e.address}
              href='#!'
              onClick={() => openLink(baseURL.replace('__IP__', e.address))}
              className={style.if}
            >
              {`${e.name} - ${e.address}`}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
