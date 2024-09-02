import { Playback, TimerPhase } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

import AppLink from '../../../../common/components/link/app-link/AppLink';
import { useClock, useTimerCurrent, useTimerSchedule } from '../../../../common/hooks/useSocket';
import useReport from '../../../../common/hooks-query/useReport';
import { cx } from '../../../../common/utils/styleUtils';
import { formatTime } from '../../../../common/utils/time';

import style from './TimerSpeed.module.scss';

interface MeetScheduleProps {
  speed: number;
  newSpeed: number;
}

/**
 * We isolate this component since it has the potential to re-render on every second
 */
export default function TimerSchedule(props: MeetScheduleProps) {
  const { speed, newSpeed } = props;
  const { startedAt, expectedFinish, phase, playback } = useTimerSchedule();

  const started = formatTime(startedAt);
  const normalisedExpectedEnd = expectedFinish !== null ? expectedFinish % dayInMs : null;
  const endTime = formatTime(normalisedExpectedEnd);

  const isWaiting = phase === TimerPhase.Pending;
  const hasNewSpeed = speed !== newSpeed;

  if (isWaiting) {
    return <div className={cx([style.entry, style.roll])}>Roll: Countdown to start</div>;
  }

  if (playback === Playback.Stop) {
    return <StoppedStatus />;
  }

  return (
    <div className={style.timers}>
      <div className={style.entry}>
        <div className={style.timerLabel}>Started at</div>
        <div>{started}</div>
      </div>
      <div className={style.entry}>
        <div className={style.timerLabel}>Expected end</div>
        {hasNewSpeed ? <SpeedFinish newSpeed={newSpeed} /> : <div>{endTime}</div>}
      </div>
    </div>
  );
}

// TODO: extract and test
// calculate the new finish time
function useExpectedTime(remainingTimeMs: number, speedFactor: number): number {
  const { clock } = useClock();
  const adjustedRemainingTimeMs = remainingTimeMs / speedFactor;
  const newFinishTimeMs = clock + adjustedRemainingTimeMs;
  return newFinishTimeMs;
}

function StoppedStatus() {
  const { data } = useReport();
  const hasReport = Object.keys(data).length > 0;

  if (hasReport) {
    return (
      <AppLink className={style.entry} search='settings=feature_settings__report'>
        Go to report management
      </AppLink>
    );
  }

  return <div className={style.entry}>No running playback</div>;
}

interface SpeedFinishProps {
  newSpeed: number;
}

function SpeedFinish(props: SpeedFinishProps) {
  const { newSpeed } = props;
  const { current } = useTimerCurrent();

  const newFinish = formatTime(useExpectedTime(current ?? 0, newSpeed));

  return <div className={style.highlight}>{newFinish}</div>;
}
