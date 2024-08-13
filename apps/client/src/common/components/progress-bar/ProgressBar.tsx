import { MaybeNumber } from 'ontime-types';

import { getProgress } from '../../utils/getProgress';

import './ProgressBar.scss';

interface ProgressBarProps {
  current: MaybeNumber;
  duration: MaybeNumber;
  hidden?: boolean;
  className?: string;
}

export default function ProgressBar(props: ProgressBarProps) {
  const { current, duration, hidden, className = '' } = props;
  const progress = getProgress(current, duration);

  return (
    <div className={`progress-bar__bg ${hidden ? 'progress-bar__bg--hidden' : ''} ${className}`}>
      <div className='progress-bar__indicator' style={{ width: `${progress}%` }} />
    </div>
  );
}
