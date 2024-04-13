import { CSSProperties } from 'react';

import EmptyImage from '../../../assets/images/empty.svg?react';

import style from './Empty.module.scss';

interface EmptyProps {
  text?: string;
  style?: CSSProperties;
}

export default function Empty(props: EmptyProps) {
  const { text, ...rest } = props;
  return (
    <div className={style.emptyContainer} {...rest}>
      <EmptyImage className={style.empty} />
      {text && <span className={style.text}>{text}</span>}
    </div>
  );
}
