import { useAnimatedProgress } from '../../../../common/hooks/useAnimatedProgress';
import { useSelectedEventId, useTimer } from '../../../../common/hooks/useSocket';

import style from './RundownEventProgressBar.module.scss';

export default function RundownEventProgressBar() {
  const timer = useTimer();
  const eventId = useSelectedEventId();

  const progress = useAnimatedProgress(timer.current, timer.duration, eventId);

  return <div className={style.progressBar} style={{ width: `${progress}%` }} />;
}
