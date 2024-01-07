import { useMemo } from 'react';
import { Playback } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import PlaybackIcon from '../../../common/components/playback-icon/PlaybackIcon';
import { useTimer } from '../../../common/hooks/useSocket';
import { cx } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';
import SuperscriptTime from '../../viewers/common/superscript-time/SuperscriptTime';

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
        return formatTime(timer.expectedFinish);
      }
    }
    return formatTime(firstStart);
  };

  const getTimeEnd = () => {
    if (lastEnd === undefined) {
      return '...';
    }

    if (selectedEventId) {
      if (lastId === selectedEventId) {
        return formatTime(timer.expectedFinish);
      }
    }
    return formatTime(lastEnd);
  };

  const PlaybackIconComponent = useMemo(() => {
    const isPlaying = playback === Playback.Play || playback === Playback.Roll;
    const classes = cx([styles.playbackIcon, isPlaying ? styles.active : null]);
    return <PlaybackIcon state={playback} skipTooltip className={classes} />;
  }, [playback]);

  // use user defined format
  const timeNow = formatTime(timer.clock);
  const runningTime = millisToString(timer.current);
  const elapsedTime = millisToString(timer.elapsed);

  return (
    <div className={styles.timers}>
      {PlaybackIconComponent}
      <div className={styles.timeNow}>
        <span className={styles.label}>Time now</span>
        <SuperscriptTime className={styles.timer} time={timeNow} />
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
        <SuperscriptTime className={styles.timer} time={getTimeStart()} />
      </div>
      <div className={styles.endTime}>
        <span className={styles.label}>Scheduled end</span>
        <SuperscriptTime className={styles.timer} time={getTimeEnd()} />
      </div>
    </div>
  );
}
