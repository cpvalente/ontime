import { OntimeEvent, Playback } from 'ontime-types';

import PlaybackIcon from '../../../common/components/playback-icon/PlaybackIcon';
import { useTimer } from '../../../common/hooks/useSocket';
import { formatTime } from '../../../common/utils/time';

import styles from './TimeBlock.module.scss';

export default function TimeBlock({
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
    return formatTime(timeEnd, { showSeconds: true, format: 'hh:mm:ss' });
  };

  // TODO: format should be user defined
  const timeNow = formatTime(timer.clock, {
    showSeconds: true,
    format: 'hh:mm:ss',
  });

  const runningTime = formatTime(timer.current, {
    showSeconds: true,
    format: 'hh:mm:ss',
  });

  const elapsedTime = formatTime(timer.elapsed, {
    showSeconds: true,
    format: 'hh:mm:ss',
  });

  return (
    <div className={styles.TimeBlock}>
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
