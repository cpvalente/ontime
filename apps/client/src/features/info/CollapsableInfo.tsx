import { useState } from 'react';

import CollapseBar from '../../common/components/collapse-bar/CollapseBar';

import style from './Info.module.scss';

type TitleShape = {
  title: string;
  presenter: string;
  subtitle: string;
  note: string;
};

interface CollapsableInfoProps {
  title: string;
  data: TitleShape;
}

export default function CollapsableInfo(props: CollapsableInfoProps) {
  const { title, data } = props;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={style.container}>
      <CollapseBar title={title} isCollapsed={collapsed} onClick={() => setCollapsed((prev) => !prev)} />
      {!collapsed && (
        <div className={style.labels}>
          <div>
            <span className={style.label}>Title:</span>
            <span className={style.content}>{data.title}</span>
          </div>
          <div>
            <span className={style.label}>Presenter:</span>
            <span className={style.content}>{data.presenter}</span>
          </div>
          <div>
            <span className={style.label}>Subtitle:</span>
            <span className={style.content}>{data.subtitle}</span>
          </div>
          <div>
            <span className={style.label}>Note:</span>
            <span className={style.content}>{data.note}</span>
          </div>
        </div>
      )}
    </div>
  );
}
