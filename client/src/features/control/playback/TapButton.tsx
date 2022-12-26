import { ForwardedRef, forwardRef, PropsWithChildren } from 'react';

import { Playback } from '../../../common/models/OntimeTypes';

import style from './TapButton.module.scss';

interface TapButtonProps {
  disabled?: boolean;
  square?: boolean;
  onClick: () => void;
  theme?: Playback | 'neutral';
  active?: boolean;
}

const TapButton = forwardRef((props: PropsWithChildren<TapButtonProps>, ref: ForwardedRef<HTMLButtonElement> ) => {
  const { children, disabled, onClick, theme = 'neutral', square, active } = props;
  return (
    <button
      className={`${style.tapButton} ${style[theme]} ${square ? style.square : ''} ${active ? style.active : ''}`}
      disabled={disabled}
      type='button'
      onClick={onClick}
      ref={ref}
    >
      {children}
    </button>
  );
});

TapButton.displayName = "TabButton";
export default TapButton;
