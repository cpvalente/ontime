import { ButtonHTMLAttributes, forwardRef } from 'react';

import { cx } from '../../utils/styleUtils';

import style from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'subtle' | 'subtle-white' | 'destructive' | 'subtle-destructive' | 'ghosted';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  fluid?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { className, children, variant = 'subtle', size = 'medium', fluid, ...buttonProps } = props;

  return (
    <button
      ref={ref}
      className={cx([style.baseButton, style[variant], style[size], fluid && style.fluid, className])}
      type='button'
      {...buttonProps}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
