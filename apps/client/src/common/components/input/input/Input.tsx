import { InputHTMLAttributes, forwardRef } from 'react';

import { cx } from '../../../utils/styleUtils';

import style from './Input.module.scss';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'subtle' | 'ghosted';
  height?: 'medium' | 'large';
  fluid?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, variant = 'subtle', height = 'medium', fluid, ...inputProps },
  ref,
) {
  return (
    <input
      ref={ref}
      type='text'
      autoCorrect='off'
      autoComplete='off'
      spellCheck='false'
      className={cx([style.input, style[variant], style[height], fluid && style.fluid, className])}
      {...inputProps}
    />
  );
});

export default Input;
