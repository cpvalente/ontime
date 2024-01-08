import { useTimer } from '../../../common/hooks/useSocket';
import ClockTime from '../../viewers/common/clock-time/ClockTime';
import RunningTime from '../../viewers/common/running-time/RunningTime';

import style from './CuesheetTableHeader.module.scss';

export default function CuesheetTableHeaderTimers() {
  const timer = useTimer();

  return (
    <>
      <div className={style.timer}>
        <div className={style.timerLabel}>Running Timer</div>
        <RunningTime className={style.value} value={timer.current} hideLeadingZero />
      </div>
      <div className={style.clock}>
        <div className={style.clockLabel}>Time Now</div>
        <ClockTime className={style.value} value={timer.clock} />
      </div>
    </>
  );
}
