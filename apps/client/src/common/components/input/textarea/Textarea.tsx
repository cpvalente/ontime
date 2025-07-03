import { forwardRef, TextareaHTMLAttributes } from 'react';

import { cx } from '../../../utils/styleUtils';

import style from './Textarea.module.scss';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'subtle' | 'ghosted';
  fluid?: boolean;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function TextArea(
  { className, variant = 'subtle', fluid, rows = 5, resize = 'none', style: customStyle, ...textareaProps },
  ref,
) {
  return (
    <textarea
      ref={ref}
      autoCorrect='off'
      autoComplete='off'
      spellCheck='false'
      rows={rows}
      style={{ ...customStyle, resize }}
      className={cx([style.textarea, style[variant], fluid && style.fluid, className])}
      {...textareaProps}
    />
  );
});

export default Textarea;
