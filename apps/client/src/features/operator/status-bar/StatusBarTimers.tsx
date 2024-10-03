import { useMemo } from 'react';
import { MaybeNumber, Playback } from 'ontime-types';

import PlaybackIcon from '../../../common/components/playback-icon/PlaybackIcon';
import { useClock, useTimer } from '../../../common/hooks/useSocket';
import { cx } from '../../../common/utils/styleUtils';
import ClockTime from '../../viewers/common/clock-time/ClockTime';
import RunningTime from '../../viewers/common/running-time/RunningTime';

import styles from './StatusBar.module.scss';
import { useTranslation } from '../../../../../client/src/translation/TranslationProvider';

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
  const { clock } = useClock();

  const { getLocalizedString } = useTranslation();

  const getTimeStart = (): MaybeNumber => {
    if (firstStart === undefined) {
      return null;
    }

    if (selectedEventId) {
      if (firstId === selectedEventId) {
        return timer.expectedFinish;
      }
    }
    return firstStart;
  };

  const getTimeEnd = (): MaybeNumber => {
    if (lastEnd === undefined) {
      return null;
    }

    if (selectedEventId) {
      if (lastId === selectedEventId) {
        return timer.expectedFinish;
      }
    }
    return lastEnd;
  };

  const PlaybackIconComponent = useMemo(() => {
    const isPlaying = playback === Playback.Play || playback === Playback.Roll;
    const classes = cx([styles.playbackIcon, isPlaying ? styles.active : null]);
    return <PlaybackIcon state={playback} skipTooltip className={classes} />;
  }, [playback]);

  return (
    <div className={styles.timers}>
      {PlaybackIconComponent}
      <div className={styles.timeNow}>
        <span className={styles.label}>{getLocalizedString('common.time_now')}</span>
        <ClockTime className={styles.timer} value={clock} />
      </div>
      <div className={styles.elapsedTime}>
        <span className={styles.label}>{getLocalizedString('commom.elapsed_time')}</span>
        <RunningTime className={styles.timer} value={timer.elapsed} />
      </div>
      <div className={styles.runningTime}>
        <span className={styles.label}>{getLocalizedString('countdown.running')}</span>
        <RunningTime className={styles.timer} value={timer.current} />
      </div>

      <span className={styles.title}>{projectTitle}</span>
      <div className={styles.startTime}>
        <span className={styles.label}>{getLocalizedString('common.scheduled_start')}</span>
        <ClockTime className={styles.timer} value={getTimeStart()} />
      </div>
      <div className={styles.endTime}>
        <span className={styles.label}>{getLocalizedString('common.scheduled_end')}</span>
        <ClockTime className={styles.timer} value={getTimeEnd()} />
      </div>
    </div>
  );
}
