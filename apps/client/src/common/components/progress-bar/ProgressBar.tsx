import { MaybeNumber } from 'ontime-types';

import { useAnimatedProgress } from '../../hooks/useAnimatedProgress';

import './ProgressBar.scss';

interface ProgressBarProps {
  current: MaybeNumber;
  duration: MaybeNumber;
  className?: string;
}

export default function ProgressBar(props: ProgressBarProps) {
  const { current, duration, className } = props;
  const progress = useAnimatedProgress(current, duration);

  return (
    <div className={`progress-bar__bg ${className}`}>
      <div className='progress-bar__indicator' style={{ width: `${progress}%` }} />
    </div>
  );
}
