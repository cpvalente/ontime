import { PropsWithChildren, useState } from 'react';

import CollapseBar from '../../common/components/collapse-bar/CollapseBar';

import style from './Info.module.scss';

interface CollapsableInfoProps {
  title: string;
}

export default function CollapsableInfo(props: PropsWithChildren<CollapsableInfoProps>) {
  const { title, children } = props;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={style.container}>
      <CollapseBar title={title} isCollapsed={collapsed} onClick={() => setCollapsed((prev) => !prev)} />
      {!collapsed && children}
    </div>
  );
}
