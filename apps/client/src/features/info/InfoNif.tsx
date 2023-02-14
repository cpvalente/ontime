import { useState } from 'react';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';

import CollapseBar from '../../common/components/collapse-bar/CollapseBar';
import useInfo from '../../common/hooks-query/useInfo';
import { openLink } from '../../common/utils/linkUtils';

import style from './Info.module.scss';

export default function InfoNif() {
  const { data } = useInfo();
  const [collapsed, setCollapsed] = useState(false);

  const handleClick = (address: string) => {
    const baseURL = 'http://__IP__:4001';
    openLink(baseURL.replace('__IP__', address));
  };

  return (
    <div className={style.container}>
      <CollapseBar
        title='Network Info'
        isCollapsed={collapsed}
        onClick={() => setCollapsed((prev) => !prev)}
      />
      {!collapsed && (
        <div className={style.interfaceList}>
          {data?.networkInterfaces.map((nif) => (
            <span
              key={nif.address}
              onClick={() => handleClick(nif.address)}
              className={style.interface}
            >
              {`${nif.name} - ${nif.address}`}
              <IoArrowUp className={style.linkIcon} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
