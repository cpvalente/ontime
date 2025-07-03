import { ButtonHTMLAttributes, forwardRef } from 'react';
import { IoEllipseOutline } from 'react-icons/io5';

import { cx } from '../../utils/styleUtils';

import style from './Button.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'subtle' | 'subtle-white' | 'destructive' | 'subtle-destructive' | 'ghosted' | 'ghosted-white';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  fluid?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant = 'subtle', size = 'medium', fluid, loading, ...buttonProps }, ref) => {
    return (
      <button
        ref={ref}
        className={cx([
          style.baseButton,
          style[variant],
          style[size],
          fluid && style.fluid,
          loading && style.loading,
          className,
        ])}
        type='button'
        disabled={loading || buttonProps.disabled}
        {...buttonProps}
      >
        <span className={style.content}>{children}</span>
        {loading && (
          <div className={style.loadingOverlay}>
            <IoEllipseOutline className={style.spinner} />
          </div>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
