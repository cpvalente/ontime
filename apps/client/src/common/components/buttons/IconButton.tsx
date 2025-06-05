import { ButtonHTMLAttributes } from 'react';

import { cx } from '../../utils/styleUtils';

import style from './IconButton.module.scss';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'subtle' | 'subtle-white' | 'destructive';
}

export default function IconButton(props: IconButtonProps) {
  const { className, children, variant = 'subtle', ...buttonProps } = props;

  return (
    <button className={cx([style.baseIconButton, style[variant], className])} type='button' {...buttonProps}>
      {children}
    </button>
  );
}
