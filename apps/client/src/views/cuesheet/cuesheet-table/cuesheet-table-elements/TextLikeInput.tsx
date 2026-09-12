import { HTMLAttributes, PropsWithChildren, forwardRef, memo, useImperativeHandle, useRef } from 'react';

import { cx } from '../../../../common/utils/styleUtils';

import style from './TextLikeInput.module.scss';

interface TextLikeInputProps extends HTMLAttributes<HTMLSpanElement> {
  offset?: 'over' | 'under' | 'muted' | null;
  muted?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  /** keep the content at the top of the cell (matches an editor that mounts top-aligned) */
  topAligned?: boolean;
}

const TextLikeInput = forwardRef(
  (
    {
      offset,
      muted,
      disabled,
      multiline,
      topAligned,
      children,
      className,
      ...elementProps
    }: PropsWithChildren<TextLikeInputProps>,
    textRef,
  ) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const classes = cx([
      style.textInput,
      offset && style[offset],
      muted && style.muted,
      disabled && style.disabled,
      multiline && style.multiline,
      topAligned && style.topAligned,
      className,
    ]);

    useImperativeHandle(textRef, () => {
      return {
        focusParentElement() {
          ref.current?.parentElement?.focus();
        },
      };
    });

    return (
      <div className={classes} tabIndex={disabled ? -1 : 0} {...elementProps} ref={ref}>
        {children}
      </div>
    );
  },
);

TextLikeInput.displayName = 'TextLikeInput';

export default memo(TextLikeInput);
