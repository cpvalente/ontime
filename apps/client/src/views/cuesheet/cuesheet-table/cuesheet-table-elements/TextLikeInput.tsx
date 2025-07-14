import { forwardRef, HTMLAttributes, memo, PropsWithChildren, useImperativeHandle, useRef } from 'react';

import { cx } from '../../../../common/utils/styleUtils';

import style from './TextLikeInput.module.scss';

interface TextLikeInputProps extends HTMLAttributes<HTMLSpanElement> {
  offset?: 'over' | 'under' | 'muted' | null;
  muted?: boolean;
}

const TextLikeInput = forwardRef(
  ({ offset, muted, children, className, ...elementProps }: PropsWithChildren<TextLikeInputProps>, textRef) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const classes = cx([style.textInput, offset && style[offset], muted && style.muted, className]);

    useImperativeHandle(textRef, () => {
      return {
        focusParentElement() {
          ref.current?.parentElement?.focus();
        },
      };
    });

    return (
      <div className={classes} tabIndex={0} {...elementProps} ref={ref}>
        {children}
      </div>
    );
  },
);

TextLikeInput.displayName = 'TextLikeInput';

export default memo(TextLikeInput);
