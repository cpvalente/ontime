import { PropsWithChildren, useState } from 'react';
import { IoChevronUp } from '@react-icons/all-files/io5/IoChevronUp';

import style from './CollapsableSection.module.scss';

interface CollapsableSectionProps {
  title: string;
}

export default function CollapsableSection(props: PropsWithChildren<CollapsableSectionProps>) {
  const { title, children } = props;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <div className={style.title} onClick={() => setCollapsed((prev) => !prev)}>
        {title}
        <IoChevronUp className={collapsed ? style.moreCollapsed : style.moreExpanded} />
      </div>
      {!collapsed && children}
    </>
  );
}
