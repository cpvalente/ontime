import { getPlayState } from '../../../../common/components/play-state/playState.utils';
import PlayStateMark from '../../../../common/components/play-state/PlayStateMark';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import { useTimerPlayState } from '../../../../common/hooks/useSocket';

import style from '../RundownEvent.module.scss';

/** Only rendered for the loaded event, so the other rows do not subscribe to the timer */
export default function RundownEventPlayState() {
  const { playback, phase } = useTimerPlayState();
  const playState = getPlayState(playback, phase);

  // an idle mark is too faint to read on the row, and the row already shows it is loaded
  if (playState.shape === 'faint') return null;

  return (
    <Tooltip
      text={playState.label}
      render={<PlayStateMark state={playState} className={style.playState} aria-label={playState.label} role='img' />}
    />
  );
}
