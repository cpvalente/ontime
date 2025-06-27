import { forwardRef, HTMLAttributes, memo, PropsWithChildren, useImperativeHandle, useRef } from 'react';

import { cx } from '../../../../common/utils/styleUtils';

import style from './TextLikeInput.module.scss';

interface TextLikeInputProps extends HTMLAttributes<HTMLSpanElement> {
  delayed?: boolean;
  muted?: boolean;
}

const TextLikeInput = forwardRef((props: PropsWithChildren<TextLikeInputProps>, textRef) => {
  const { delayed, muted, children, className, ...elementProps } = props;
  const ref = useRef<HTMLDivElement | null>(null);
  const classes = cx([style.textInput, delayed && style.delayed, muted && style.muted, className]);

  useImperativeHandle(textRef, () => {
    return {
      focusParentElement() {
        ref.current?.parentElement?.focus();
      },
    };
  });

  return (
    <div className={classes} {...elementProps} tabIndex={0} ref={ref}>
      {children}
    </div>
  );
});

TextLikeInput.displayName = 'TextLikeInput';

export default memo(TextLikeInput);
