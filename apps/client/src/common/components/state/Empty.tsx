import { CSSProperties } from 'react';

import EmptyImage from '../../../assets/images/empty.svg?react';
import { cx } from '../../utils/styleUtils';

import style from './Empty.module.scss';

interface EmptyProps {
  text?: string;
  injectedStyles?: CSSProperties;
  className?: string;
}

export default function Empty({ text, className, injectedStyles }: EmptyProps) {
  return (
    <div className={cx([style.emptyContainer, className])} style={injectedStyles}>
      <EmptyImage className={style.empty} />
      {text && <span className={style.text}>{text}</span>}
    </div>
  );
}
