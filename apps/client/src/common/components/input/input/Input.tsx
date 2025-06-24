import { forwardRef, InputHTMLAttributes } from 'react';

import { cx } from '../../../utils/styleUtils';

import style from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'subtle';
  height?: 'medium' | 'large';
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, variant = 'subtle', height = 'medium', ...inputProps },
  ref,
) {
  return (
    <input
      ref={ref}
      type='text'
      className={cx([style.input, style[variant], style[height], className])}
      {...inputProps}
    />
  );
});

export default Input;
