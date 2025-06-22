import { InputHTMLAttributes } from 'react';

import { cx } from '../../../utils/styleUtils';

import style from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'subtle';
  height?: 'medium' | 'large';
}

export default function Input({ className, variant = 'subtle', height = 'medium', ...inputProps }: InputProps) {
  return <input type='text' className={cx([style.input, style[variant], style[height], className])} {...inputProps} />;
}
