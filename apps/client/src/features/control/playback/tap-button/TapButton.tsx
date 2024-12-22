import { ButtonHTMLAttributes, ForwardedRef, forwardRef, PropsWithChildren } from 'react';
import { Playback } from 'ontime-types';

import { cx } from '../../../../common/utils/styleUtils';

import style from './TapButton.module.scss';

interface TapButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  aspect?: 'normal' | 'square' | 'fill' | 'tight';
  free?: boolean;
  onClick: () => void;
  theme?: Playback | 'neutral';
  active?: boolean;
  className?: string;
}

const TapButton = forwardRef((props: PropsWithChildren<TapButtonProps>, ref: ForwardedRef<HTMLButtonElement>) => {
  const {
    children,
    disabled,
    onClick,
    theme = 'neutral',
    aspect = 'normal',
    active,
    className,
    ...elementProps
  } = props;
  const classes = cx([style.tapButton, className, style[theme], style[aspect], active ? style.active : null]);

  return (
    <button className={classes} disabled={disabled} type='button' onClick={onClick} ref={ref} {...elementProps}>
      {children}
    </button>
  );
});

TapButton.displayName = 'TabButton';
export default TapButton;
