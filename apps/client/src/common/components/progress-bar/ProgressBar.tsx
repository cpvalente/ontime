import { MaybeNumber } from 'ontime-types';

import { useAnimatedProgress } from '../../hooks/useAnimatedProgress';

import './ProgressBar.scss';

interface ProgressBarProps {
  current: MaybeNumber;
  duration: MaybeNumber;
  eventId?: string | null;
  className?: string;
}

export default function ProgressBar({ current, duration, eventId, className }: ProgressBarProps) {
  const progress = useAnimatedProgress(current, duration, eventId);

  return (
    <div className={`progress-bar__bg ${className}`}>
      <div className='progress-bar__indicator' style={{ width: `${progress}%` }} />
    </div>
  );
}
