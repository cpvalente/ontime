import { MaybeNumber } from 'ontime-types';

import { getProgress } from '../../utils/getProgress';

import './ProgressBar.scss';

interface ProgressBarProps {
  current: MaybeNumber;
  duration: MaybeNumber;
  className?: string;
}

export default function ProgressBar(props: ProgressBarProps) {
  const { current, duration, className } = props;
  const progress = getProgress(current, duration);

  return (
    <div className={`progress-bar__bg ${className}`}>
      <div className='progress-bar__indicator' style={{ width: `${progress}%` }} />
    </div>
  );
}
