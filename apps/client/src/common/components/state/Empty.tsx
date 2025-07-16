import { CSSProperties } from 'react';

import EmptyImage from '../../../assets/images/empty.svg?react';
import { cx } from '../../utils/styleUtils';

import style from './Empty.module.scss';

interface EmptyProps {
  text?: string;
  style?: CSSProperties;
  className?: string;
}

export default function Empty({ text, className, ...rest }: EmptyProps) {
  return (
    <div className={cx([style.emptyContainer, className])} {...rest}>
      <EmptyImage className={style.empty} />
      {text && <span className={style.text}>{text}</span>}
    </div>
  );
}
