import { Playback } from 'ontime-types';
import { ForwardedRef, PropsWithChildren, forwardRef } from 'react';

import { cx } from '../../../../common/utils/styleUtils';

import style from './TapButton.module.scss';

interface TapButtonProps {
  disabled?: boolean;
  aspect?: 'normal' | 'square' | 'fill' | 'tight';
  free?: boolean;
  onClick: () => void;
  theme?: Playback | 'neutral';
  active?: boolean;
  className?: string;
}

const TapButton = forwardRef((props: PropsWithChildren<TapButtonProps>, ref: ForwardedRef<HTMLButtonElement>) => {
  const { children, disabled, onClick, theme = 'neutral', aspect = 'normal', active, className } = props;

  return (
    <button
      className={cx([style.tapButton, className, style[theme], style[aspect], active && style.active])}
      disabled={disabled}
      type='button'
      onClick={onClick}
      ref={ref}
    >
      {children}
    </button>
  );
});

TapButton.displayName = 'TabButton';
export default TapButton;
