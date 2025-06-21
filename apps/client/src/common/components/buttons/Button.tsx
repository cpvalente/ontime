import { ButtonHTMLAttributes } from 'react';

import { cx } from '../../utils/styleUtils';

import style from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'subtle' | 'primary';
  size?: 'medium' | 'large' | 'xlarge';
}

export default function Button(props: ButtonProps) {
  const { className, children, variant = 'subtle', size = 'medium', ...buttonProps } = props;

  return (
    <button className={cx([style.baseButton, style[variant], style[size], className])} type='button' {...buttonProps}>
      {children}
    </button>
  );
}
