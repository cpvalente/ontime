import { CSSProperties } from 'react';

import { ReactComponent as Emptyimage } from '@/assets/images/empty.svg';

import style from './Empty.module.scss';

interface EmptyProps {
  text: string;
  style?: CSSProperties;
}

export default function Empty(props: EmptyProps) {
  const { text, ...rest } = props;
  return (
    <div className={style.emptyContainer} {...rest}>
      <Emptyimage className={style.empty} />
      <span className={style.text}>{text}</span>
    </div>
  );
}
