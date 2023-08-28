import { OntimeEvent, Playback } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import PlaybackIcon from '../../../common/components/playback-icon/PlaybackIcon';
import { useTimer } from '../../../common/hooks/useSocket';
import { formatTime } from '../../../common/utils/time';

import styles from './StatusBar.module.scss';

export default function StatusBar({
  playback,
  lastEvent,
  selectedEventId,
}: {
  playback: Playback;
  lastEvent: OntimeEvent | null;
  selectedEventId: string | null;
}) {
  const timer = useTimer();

  const getTimeEnd = () => {
    if (lastEvent === null) {
      return '...';
    }

    const timeEnd = lastEvent.id === selectedEventId ? timer.expectedFinish : lastEvent.timeEnd;
    return millisToString(timeEnd);
  };

  // use user defined format
  const timeNow = formatTime(timer.clock, {
    showSeconds: true,
  });

  const runningTime = millisToString(timer.current);
  const elapsedTime = millisToString(timer.elapsed);

  return (
    <div className={styles.statusBar}>
      <PlaybackIcon state={playback} />
      <div className={styles.clock}>
        <div className={styles.column}>
          <span className={styles.label}>Time now</span>
          <span className={styles.timer}>{timeNow}</span>
        </div>
        <div className={styles.column}>
          <span className={styles.label}>Time to end</span>
          <span className={styles.timer}>{getTimeEnd()}</span>
        </div>
        <div className={styles.column}>
          <span className={styles.label}>Elapsed time</span>
          <span className={styles.timer}>{elapsedTime}</span>
        </div>
        <div className={styles.column}>
          <span className={styles.label}>Running timer</span>
          <span className={styles.timer}>{runningTime}</span>
        </div>
      </div>
    </div>
  );
}
