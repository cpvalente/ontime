import { MaybeNumber } from 'ontime-types';

import { useTimer } from '../../../../common/hooks/useSocket';
import { clamp } from '../../../../common/utils/math';

import style from './EventBlockProgressBar.module.scss';

export function getPercentComplete(remaining: MaybeNumber, total: MaybeNumber): number {
  if (remaining === null || total === null) {
    return 0;
  }

  if (remaining <= 0) {
    return 100;
  }

  if (remaining === total) {
    return 0;
  }

  return clamp(100 - (remaining * 100) / total, 0, 100);
}

export default function EventBlockProgressBar() {
  const timer = useTimer();

  const progress = `${getPercentComplete(timer.current, timer.duration)}%`;
  return <div className={style.progressBar} style={{ width: progress }} />;
}
