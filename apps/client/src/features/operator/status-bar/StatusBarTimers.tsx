import { isPlaybackActive } from 'ontime-utils';

import { useClock, useTimer } from '../../../common/hooks/useSocket';
import { cx } from '../../../common/utils/styleUtils';
import ClockTime from '../../viewers/common/clock-time/ClockTime';
import RunningTime from '../../viewers/common/running-time/RunningTime';

import styles from './StatusBar.module.scss';

export default function StatusBarTimers() {
  const timer = useTimer();
  const { clock } = useClock();

  const playbackActive = isPlaybackActive(timer.playback);

  return (
    <div className={styles.timers}>
      <div className={styles.runningTimer}>
        <span className={styles.label}>Running timer</span>
        <RunningTime
          className={cx([styles.timer, playbackActive && styles.active])}
          value={timer.current}
          hideLeadingZero
        />
      </div>

      <div className={styles.timeNow}>
        <span className={styles.label}>Time now</span>
        <ClockTime className={styles.timer} value={clock} />
      </div>
    </div>
  );
}
