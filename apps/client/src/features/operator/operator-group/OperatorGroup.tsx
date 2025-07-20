import { memo } from 'react';

import style from './OperatorGroup.module.scss';

interface OperatorGroup {
  title: string;
}

export default memo(OperatorGroup);
function OperatorGroup({ title }: OperatorGroup) {
  return <div className={style.group}>{title}</div>;
}
