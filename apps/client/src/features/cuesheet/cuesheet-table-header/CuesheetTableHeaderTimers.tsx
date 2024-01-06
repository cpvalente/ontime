import { millisToString } from 'ontime-utils';

import { useTimer } from '../../../common/hooks/useSocket';
import { formatTime } from '../../../common/utils/time';

import style from './CuesheetTableHeader.module.scss';

export default function CuesheetTableHeaderTimers() {
  const timer = useTimer();

  const timerNow = millisToString(timer.current);
  const timeNow = formatTime(timer.clock);

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
