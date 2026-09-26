import { useDisplayTimezone } from '../../../common/hooks/useDisplayTimezone';
import TimezoneBadge from '../../../views/common/timezone/TimezoneBadge';
import { ClockOverview, TimerOverview } from '../../overview/composite/TimeElements';

import style from './StatusBar.module.scss';

export default function StatusBarTimers() {
  const { timezoneDelta, displayZone } = useDisplayTimezone();

  return (
    <div className={style.timers}>
      <div className={style.timezone}>
        <TimezoneBadge displayZone={displayZone} timezoneDelta={timezoneDelta} placement='inline' />
      </div>
      <TimerOverview className={style.runningTimer} />
      <ClockOverview className={style.timeNow} shouldFormat timezoneDelta={timezoneDelta} />
    </div>
  );
}
