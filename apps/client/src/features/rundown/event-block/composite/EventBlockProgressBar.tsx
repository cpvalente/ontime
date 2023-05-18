import { Playback } from 'ontime-types';

import { useTimer } from '../../../../common/hooks/useSocket';
import { clamp } from '../../../../common/utils/math';

import style from './EventBlockProgressBar.module.scss';

interface EventBlockProgressBarProps {
  playback?: Playback;
}

export default function EventBlockProgressBar(props: EventBlockProgressBarProps) {
  const { playback } = props;
  const timer = useTimer();

  const now = Math.floor(Math.max((timer?.current ?? 1) / 1000, 0));
  const complete = (timer?.duration ?? 1) / 1000;
  const elapsed = clamp(100 - (now * 100) / complete, 0, 100);
  const progress = `${elapsed}%`;

  if ((timer?.current ?? 0) < 0) {
    return <div className={`${style.progressBar} ${style.overtime}`} style={{ width: '100%' }} />;
  }

  return <div className={`${style.progressBar} ${playback ? style[playback] : ''}`} style={{ width: progress }} />;
}
