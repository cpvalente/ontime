import { HTMLAttributes, memo, PropsWithChildren } from 'react';

import { cx } from '../../../../common/utils/styleUtils';

import style from './TextLikeInput.module.scss';

export default memo(TextLikeInput);

interface TextLikeInputProps extends HTMLAttributes<HTMLSpanElement> {
  delayed?: boolean;
  muted?: boolean;
}

function TextLikeInput(props: PropsWithChildren<TextLikeInputProps>) {
  const { delayed, muted, children, className, ...elementProps } = props;
  const classes = cx([style.textInput, delayed && style.delayed, muted && style.muted, className]);
  return (
    <div className={classes} {...elementProps} tabIndex={0}>
      {children}
    </div>
  );
}
