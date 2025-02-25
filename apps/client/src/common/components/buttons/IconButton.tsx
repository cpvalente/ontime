import { ButtonHTMLAttributes } from 'react';

import { cx } from '../../utils/styleUtils';

import style from './IconButton.module.scss';

export default function IconButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, children, ...buttonProps } = props;
  return (
    <button className={cx([style.subtle, className])} {...buttonProps}>
      {children}
    </button>
  );
}
