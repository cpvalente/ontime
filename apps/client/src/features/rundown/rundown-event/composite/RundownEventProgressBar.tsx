import { memo } from 'react';

import { useTimer } from '../../../../common/hooks/useSocket';
import { getProgress } from '../../../../common/utils/getProgress';

import style from './RundownEventProgressBar.module.scss';

function RundownEventProgressBarComponent() {
  const timer = useTimer();

  const progress = getProgress(timer.current, timer.duration);

  return <div className={style.progressBar} style={{ width: `${progress}%` }} />;
}
export default memo(RundownEventProgressBarComponent);
