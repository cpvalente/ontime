import type { LabelHTMLAttributes, ReactNode } from 'react';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { type IconBaseProps } from '@react-icons/all-files/lib';

import { cx } from '../../../common/utils/styleUtils';

import style from './EditorUtils.module.scss';

export function Corner({ className, ...elementProps }: IconBaseProps) {
  return <IoArrowUp className={cx([style.corner, className])} {...elementProps} />;
}

export function Title({ children }: { children: ReactNode }) {
  return <h3 className={style.title}>{children}</h3>;
}

export function Label({ children, className, ...elementProps }: LabelHTMLAttributes<HTMLLabelElement>) {
  const classes = cx([style.label, className]);
  return (
    <label className={classes} {...elementProps}>
      {children}
    </label>
  );
}
