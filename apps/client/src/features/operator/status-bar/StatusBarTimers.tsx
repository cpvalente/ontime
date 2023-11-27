import { useMemo } from 'react';
import { Playback } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import PlaybackIcon from '../../../common/components/playback-icon/PlaybackIcon';
import { useTimer } from '../../../common/hooks/useSocket';
import { cx } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';

import styles from './StatusBar.module.scss';

interface StatusBarTimersProps {
  projectTitle: string;
  playback: Playback;
  selectedEventId: string | null;
  firstStart?: number;
  firstId?: string;
  lastEnd?: number;
  lastId?: string;
}

export default function StatusBarTimers(props: StatusBarTimersProps) {
  const { projectTitle, playback, selectedEventId, firstStart, firstId, lastEnd, lastId } = props;

  const timer = useTimer();

  const getTimeStart = () => {
    if (firstStart === undefined) {
      return '...';
    }

    if (selectedEventId) {
      if (firstId === selectedEventId) {
        return millisToString(timer.expectedFinish);
      }
    }
    return millisToString(firstStart);
  };

  const getTimeEnd = () => {
    if (lastEnd === undefined) {
      return '...';
    }

    if (selectedEventId) {
      if (lastId === selectedEventId) {
        return millisToString(timer.expectedFinish);
      }
    }
    return millisToString(lastEnd);
  };

  const PlaybackIconComponent = useMemo(() => {
    const isPlaying = playback === Playback.Play || playback === Playback.Roll;
    const classes = cx([styles.playbackIcon, isPlaying ? styles.active : null]);
    return <PlaybackIcon state={playback} skipTooltip className={classes} />;
  }, [playback]);

  // use user defined format
  const timeNow = formatTime(timer.clock, {
    showSeconds: true,
  });

  const runningTime = millisToString(timer.current);
  const elapsedTime = millisToString(timer.elapsed);

  return (
    <div className={styles.timers}>
      {PlaybackIconComponent}
      <div className={styles.timeNow}>
        <span className={styles.label}>Time now</span>
        <span className={styles.timer}>{timeNow}</span>
      </div>
      <div className={styles.elapsedTime}>
        <span className={styles.label}>Elapsed time</span>
        <span className={styles.timer}>{elapsedTime}</span>
      </div>
      <div className={styles.runningTime}>
        <span className={styles.label}>Running timer</span>
        <span className={styles.timer}>{runningTime}</span>
      </div>

      <span className={styles.title}>{projectTitle}</span>
      <div className={styles.startTime}>
        <span className={styles.label}>Scheduled start</span>
        <span className={styles.timer}>{getTimeStart()}</span>
      </div>
      <div className={styles.endTime}>
        <span className={styles.label}>Scheduled end</span>
        <span className={styles.timer}>{getTimeEnd()}</span>
      </div>
    </div>
  );
}
