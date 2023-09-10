import { memo } from 'react';

import style from './OperatorBlock.module.scss';

interface OperatorBlockProps {
  title: string;
}

function OperatorBlock({ title }: OperatorBlockProps) {
  return <div className={style.block}>{title}</div>;
}

export default memo(OperatorBlock);
