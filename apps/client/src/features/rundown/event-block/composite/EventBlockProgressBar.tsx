import { useClientTimePrediction } from '../../../../common/hooks/useClientTimePrediction';
import { useTimer } from '../../../../common/hooks/useSocket';
import { getProgress } from '../../../../common/utils/getProgress';

import style from './EventBlockProgressBar.module.scss';

export default function EventBlockProgressBar() {
  const { duration } = useTimer();
  const clientCurrent = useClientTimePrediction();
  const progress = getProgress(clientCurrent, duration);

  return <div className={style.progressBar} style={{ width: `${progress}%` }} />;
}
