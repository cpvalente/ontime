import { clamp } from 'common/utils/math';

import './ProgressBar.scss';

interface ProgressBarProps {
  now?: number;
  complete?: number;
  className?: string;
}

export default function ProgressBar(props: ProgressBarProps) {
  const { now = 0, complete = 100, className = '' } = props;

  const percentComplete = clamp(100 - (Math.max(now, 0) * 100) / complete, 0, 100);

  console.log(now, complete, percentComplete);
  return (
    <div className={`progress-bar__bg ${className}`}>
      <div
        className='progress-bar__indicator'
        style={{ width: `${percentComplete}%` }}
      />
    </div>
  );
}
