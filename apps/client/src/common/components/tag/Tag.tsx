import { PropsWithChildren } from 'react';

import { cx } from '../../utils/styleUtils';

import style from './Tag.module.scss';

interface TagProps {
  className?: string;
  variant?: 'default' | 'warning';
}

export default function Tag({ className, variant = 'default', children }: PropsWithChildren<TagProps>) {
  return <span className={cx([style.tag, style[variant], className])}>{children}</span>;
}
