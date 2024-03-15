import { ForwardedRef, forwardRef, PropsWithChildren } from 'react';
import { Playback } from 'ontime-types';
import { UnstyledButton } from '@mantine/core';
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
  const classes = cx([style.tapButton, className, style[theme], style[aspect], active ? style.active : null]);

  return (
    <UnstyledButton className={classes} disabled={disabled} type='button' onClick={onClick} ref={ref}>
      {children}
    </UnstyledButton>
  );
});

TapButton.displayName = 'TabButton';
export default TapButton;
