import { useAnimatedProgress } from '../../../../common/hooks/useAnimatedProgress';
import { useSelectedEventId, useTimer } from '../../../../common/hooks/useSocket';
import { getProgress } from '../../../../common/utils/getProgress';

import style from './RundownEventProgressBar.module.scss';

interface RundownEventProgressBarProps {
  showPhases: boolean;
}

export default function RundownEventProgressBar({ showPhases }: RundownEventProgressBarProps) {
  const timer = useTimer();
  const eventId = useSelectedEventId();

  const progress = useAnimatedProgress(timer.current, timer.duration, eventId);
  const warningStart = timer.timeWarning === null ? 100 : getProgress(timer.timeWarning, timer.duration);
  const dangerStart = timer.timeDanger === null ? 100 : getProgress(timer.timeDanger, timer.duration);

  return (
    <>
      {showPhases && Boolean(timer.duration) && (
        <>
          <div
            className={style.warningZone}
            style={{ left: `${warningStart}%`, width: `${Math.max(dangerStart - warningStart, 0)}%` }}
            data-testid='progress-warning-zone'
          />
          <div
            className={style.dangerZone}
            style={{ left: `${dangerStart}%`, width: `${100 - dangerStart}%` }}
            data-testid='progress-danger-zone'
          />
        </>
      )}
      <div className={style.progressBar} style={{ width: `${progress}%` }} />
    </>
  );
}
