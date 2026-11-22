import { Playback, TimerPhase } from 'ontime-types';

import { getPlayState } from '../../../../common/components/play-state/playState.utils';
import PlayStateMark from '../../../../common/components/play-state/PlayStateMark';
import Tooltip from '../../../../common/components/tooltip/Tooltip';
import { formatDuration } from '../../../../common/utils/time';

import style from './TimerIndicators.module.scss';

interface TimerIndicatorsProps {
  playback: Playback;
  phase: TimerPhase;
  addedTime: number;
  isCountToEnd: boolean;
}

function getAddedTimeLabel(addedTime: number) {
  if (addedTime > 0) return `${formatDuration(addedTime, false)} added to this timer`;
  if (addedTime < 0) return `${formatDuration(Math.abs(addedTime), false)} removed from this timer`;
  return '';
}

/**
 * Marks beside the playback timer, about the timer only
 * top: play state, middle: overtime or count to end, bottom: time added or removed
 * The slots never move and nothing animates
 */
export default function TimerIndicators({ playback, phase, addedTime, isCountToEnd }: TimerIndicatorsProps) {
  const play = getPlayState(playback, phase);
  const isOvertime = phase === TimerPhase.Overtime;
  const sign = isOvertime ? 'overtime' : isCountToEnd ? 'count-to-end' : 'none';
  const signLabel = isOvertime ? 'Overtime' : isCountToEnd ? 'Count to end' : '';
  const direction = addedTime > 0 ? 'up' : addedTime < 0 ? 'down' : 'none';
  const addedTimeLabel = getAddedTimeLabel(addedTime);

  return (
    <div className={style.indicators}>
      <Tooltip text={play.label} render={<PlayStateMark state={play} aria-label={play.label} role='img' />} />
      <Tooltip
        text={signLabel}
        render={<span aria-label={signLabel || undefined} role={signLabel ? 'img' : undefined} />}
        className={style.sign}
        data-sign={sign}
      />
      <Tooltip
        text={addedTimeLabel}
        render={<span aria-label={addedTimeLabel || undefined} role={addedTimeLabel ? 'img' : undefined} />}
        className={style.addedTime}
        data-direction={direction}
      />
    </div>
  );
}
