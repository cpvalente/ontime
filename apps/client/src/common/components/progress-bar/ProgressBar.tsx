import { clamp } from '../../utils/math';

import './ProgressBar.scss';

interface ProgressBarProps {
  now?: number;
  complete?: number;
  hidden?: boolean;
  className?: string;
}

export default function ProgressBar(props: ProgressBarProps) {
  const { now = 0, complete = 100, hidden, className = '' } = props;

  const percentComplete = clamp(100 - (Math.max(now, 0) * 100) / complete, 0, 100);

  return (
    <div className={`progress-bar__bg ${hidden ? 'progress-bar__bg--hidden' : ''} ${className}`}>
      <div className='progress-bar__indicator' style={{ width: `${percentComplete}%` }} />
    </div>
  );
}
