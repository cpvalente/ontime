import type { HTMLAttributes, LabelHTMLAttributes } from 'react';
import { IconBaseProps } from 'react-icons';
import { IoArrowUp } from 'react-icons/io5';

import { cx } from '../../utils/styleUtils';

import style from './EditorUtils.module.scss';

export function Corner({ className, ...elementProps }: IconBaseProps) {
  return <IoArrowUp className={cx([style.corner, className])} {...elementProps} />;
}

export function Title({ children, className, ...elementProps }: HTMLAttributes<HTMLHeadingElement>) {
  const classes = cx([style.title, className]);
  return (
    <h3 className={classes} {...elementProps}>
      {children}
    </h3>
  );
}

export function Label({ children, className, ...elementProps }: LabelHTMLAttributes<HTMLLabelElement>) {
  const classes = cx([style.label, className]);
  return (
    <label className={classes} {...elementProps}>
      {children}
    </label>
  );
}

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ className, orientation = 'vertical', ...elementProps }: SeparatorProps) {
  return <div className={cx([style.separator, style[orientation], className])} role='separator' {...elementProps} />;
}
