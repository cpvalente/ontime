import { useTimer } from '../../../../common/hooks/useSocket';
import { getProgress } from '../../../../common/utils/getProgress';

import style from './RundownEventProgressBar.module.scss';

export default function RundownEventProgressBar() {
  const timer = useTimer();

  const progress = getProgress(timer.current, timer.duration);

  return <div className={style.progressBar} style={{ width: `${progress}%` }} />;
}
