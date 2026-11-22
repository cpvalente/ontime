import { ComponentProps } from 'react';

import { cx } from '../../utils/styleUtils';
import { PlayState } from './playState.utils';

import style from './PlayStateMark.module.scss';

interface PlayStateMarkProps extends ComponentProps<'span'> {
  state: Pick<PlayState, 'shape' | 'tone'>;
}

/** Dot for the play state: filled is running, ring is paused or waiting, faint is idle */
export default function PlayStateMark({ state, className, ...props }: PlayStateMarkProps) {
  return <span className={cx([style.mark, className])} data-shape={state.shape} data-tone={state.tone} {...props} />;
}
