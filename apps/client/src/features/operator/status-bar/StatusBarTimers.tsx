import { ClockOverview, TimerOverview } from '../../overview/composite/TimeElements';

import style from './StatusBar.module.scss';

export default function StatusBarTimers() {
  return (
    <div className={style.timers}>
      <TimerOverview className={style.runningTimer} />
      <ClockOverview className={style.timeNow} shouldFormat />
    </div>
  );
}
