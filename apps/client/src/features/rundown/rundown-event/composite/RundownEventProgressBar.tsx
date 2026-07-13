import { useAnimatedProgress } from '../../../../common/hooks/useAnimatedProgress';
import { useTimer } from '../../../../common/hooks/useSocket';

import style from './RundownEventProgressBar.module.scss';

export default function RundownEventProgressBar() {
  const timer = useTimer();

  const progress = useAnimatedProgress(timer.current, timer.duration);

  return <div className={style.progressBar} style={{ width: `${progress}%` }} />;
}
