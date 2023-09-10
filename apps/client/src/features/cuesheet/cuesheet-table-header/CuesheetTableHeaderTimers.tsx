import { formatDisplay } from 'ontime-utils';

import { useTimer } from '../../../common/hooks/useSocket';
import { formatTime } from '../../../common/utils/time';

import style from './CuesheetTableHeader.module.scss';

export default function CuesheetTableHeaderTimers() {
  const timer = useTimer();

  // prepare presentation variables
  const isOvertime = (timer.current ?? 0) < 0;
  const timerNow = timer.current == null ? '-' : `${isOvertime ? '-' : ''}${formatDisplay(timer.current)}`;
  const timeNow = formatTime(timer.clock, {
    showSeconds: true,
    format: 'hh:mm:ss a',
  });

  return (
    <>
      <div className={style.timer}>
        <div className={style.timerLabel}>Running Timer</div>
        <div className={style.value}>{timerNow}</div>
      </div>
      <div className={style.clock}>
        <div className={style.clockLabel}>Time Now</div>
        <div className={style.value}>{timeNow}</div>
      </div>
    </>
  );
}
