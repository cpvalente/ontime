import { ButtonHTMLAttributes } from 'react';

import { cx } from '../../utils/styleUtils';

import style from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'subtle' | 'subtle-white' | 'destructive' | 'subtle-destructive';
  size?: 'medium' | 'large' | 'xlarge';
  fluid?: boolean;
}

export default function Button(props: ButtonProps) {
  const { className, children, variant = 'subtle', size = 'medium', fluid, ...buttonProps } = props;

  return (
    <button
      className={cx([style.baseButton, style[variant], style[size], fluid && style.fluid, className])}
      type='button'
      {...buttonProps}
    >
      {children}
    </button>
  );
}
