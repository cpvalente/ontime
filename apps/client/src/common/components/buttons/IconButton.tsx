import { ButtonHTMLAttributes } from 'react';

import { cx } from '../../utils/styleUtils';

import style from './IconButton.module.scss';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'subtle' | 'subtle-white' | 'destructive';
  size?: 'medium' | 'large' | 'xlarge';
}

export default function IconButton(props: IconButtonProps) {
  const { className, children, variant = 'subtle', size = 'medium', ...buttonProps } = props;

  return (
    <button
      className={cx([style.baseIconButton, style[variant], style[size], className])}
      type='button'
      {...buttonProps}
    >
      {children}
    </button>
  );
}
