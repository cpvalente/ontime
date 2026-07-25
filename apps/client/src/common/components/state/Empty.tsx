import { CSSProperties } from 'react';
import { IoWarningOutline } from 'react-icons/io5';

import EmptyImage from '../../../assets/images/empty.svg?react';
import { cx } from '../../utils/styleUtils';

import style from './Empty.module.scss';

interface EmptyProps {
  text?: string;
  injectedStyles?: CSSProperties;
  className?: string;
  variant?: 'error';
}

export default function Empty({ text, className, injectedStyles, variant }: EmptyProps) {
  return (
    <div
      className={cx([style.emptyContainer, variant === 'error' && style.error, className])}
      style={injectedStyles}
      role={variant === 'error' ? 'alert' : undefined}
    >
      <EmptyImage className={style.empty} />
      {variant === 'error' && <IoWarningOutline className={style.errorIcon} aria-hidden />}
      {text && <span className={style.text}>{text}</span>}
    </div>
  );
}
