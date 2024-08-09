import { useTimer } from '../../../../common/hooks/useSocket';
import { getProgress } from '../../../../common/utils/getProgress';

import style from './EventBlockProgressBar.module.scss';

export default function EventBlockProgressBar() {
  const timer = useTimer();

  const progress = getProgress(timer.current, timer.duration);

  return <div className={style.progressBar} style={{ width: `${progress}%` }} />;
}
