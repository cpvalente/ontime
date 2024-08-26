import { MILLIS_PER_HOUR } from 'ontime-utils';

import { useClock } from '../../../../common/hooks/useSocket';
import { getRelativePositionX } from '../timeline.utils';

import style from './TimelineProgressBar.module.scss';

interface ProgressBarProps {
  startHour: number;
  endHour: number;
}

export default function ProgressBar(props: ProgressBarProps) {
  const { startHour, endHour } = props;
  // TODO: how to account for days?
  const { clock } = useClock();

  const width = getRelativePositionX(startHour * MILLIS_PER_HOUR, endHour * MILLIS_PER_HOUR, clock);

  return (
    <div className={style.progressBar}>
      <div className={style.progress} style={{ width: `${width}%` }} />
    </div>
  );
}
