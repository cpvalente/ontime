import { ButtonHTMLAttributes, forwardRef } from 'react';

import { cx } from '../../utils/styleUtils';

import style from './IconButton.module.scss';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'subtle'
    | 'subtle-white'
    | 'destructive'
    | 'subtle-destructive'
    | 'ghosted'
    | 'ghosted-white'
    | 'ghosted-destructive';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, children, variant = 'subtle', size = 'medium', ...buttonProps }, ref) => {
    return (
      <button
        ref={ref}
        className={cx([style.baseIconButton, style[variant], style[size], className])}
        type='button'
        {...buttonProps}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';

export default IconButton;
