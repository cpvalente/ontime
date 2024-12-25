import { ButtonHTMLAttributes, ForwardedRef, forwardRef, PropsWithChildren } from 'react';
import { Playback } from 'ontime-types';

import { cx } from '../../../../common/utils/styleUtils';

import style from './TapButton.module.scss';

interface TapButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  aspect?: 'normal' | 'square' | 'fill' | 'tight';
  theme?: Playback | 'neutral';
  active?: boolean;
}

const TapButton = forwardRef((props: PropsWithChildren<TapButtonProps>, ref: ForwardedRef<HTMLButtonElement>) => {
  const { children, theme = 'neutral', aspect = 'normal', active, className, ...elementProps } = props;
  const classes = cx([style.tapButton, className, style[theme], style[aspect], active ? style.active : null]);

  return (
    <button className={classes} type='button' ref={ref} {...elementProps}>
      {children}
    </button>
  );
});

TapButton.displayName = 'TabButton';
export default TapButton;
