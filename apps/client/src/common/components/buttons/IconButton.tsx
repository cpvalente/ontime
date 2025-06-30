import { ButtonHTMLAttributes } from 'react';

import { cx } from '../../utils/styleUtils';

import style from './IconButton.module.scss';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'subtle' | 'subtle-white' | 'destructive' | 'subtle-destructive' | 'ghosted';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

export default function IconButton({
  className,
  children,
  variant = 'subtle',
  size = 'medium',
  ...buttonProps
}: IconButtonProps) {
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
