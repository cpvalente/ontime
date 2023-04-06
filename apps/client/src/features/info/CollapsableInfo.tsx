import { PropsWithChildren, useState } from 'react';

import CollapseBar from '../../common/components/collapse-bar/CollapseBar';

interface CollapsableInfoProps {
  title: string;
}

export default function CollapsableInfo(props: PropsWithChildren<CollapsableInfoProps>) {
  const { title, children } = props;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <CollapseBar title={title} isCollapsed={collapsed} onClick={() => setCollapsed((prev) => !prev)} />
      {!collapsed && children}
    </>
  );
}
