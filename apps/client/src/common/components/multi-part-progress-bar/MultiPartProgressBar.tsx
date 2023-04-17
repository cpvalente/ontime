import { clamp } from '../../utils/math';

import './MultiPartProgressBar.scss';

interface MultiPartProgressBar {
  now: number;
  complete: number;
  normalColor: string;
  warning: number;
  warningColor: string;
  danger: number;
  dangerColor: string;
  hidden?: boolean;
  className?: string;
  height?: string;
}

export default function MultiPartProgressBar(props: MultiPartProgressBar) {
  const {
    now,
    complete,
    normalColor,
    warning,
    warningColor,
    danger,
    dangerColor,
    hidden,
    className = '',
    height = '',
  } = props;

  const percentComplete = 100 - clamp(100 - (Math.max(now, 0) * 100) / complete, 0, 100);

  const dangerWidth = clamp((danger / complete) * 100, 0, 100);
  const warningWidth = clamp((warning / complete) * 100, 0, 100);

  return (
    <div className={`progress-bar ${hidden ? 'progress-bar--hidden' : ''} ${className}`} style={{ height: height }}>
      <div className='progress-bar__bg-normal' style={{ backgroundColor: normalColor }} />
      <div className='progress-bar__bg-warning' style={{ width: `${warningWidth}%`, backgroundColor: warningColor }} />
      <div className='progress-bar__bg-danger' style={{ width: `${dangerWidth}%`, backgroundColor: dangerColor }} />
      <div className='progress-bar__indicator' style={{ width: `${percentComplete}%` }} />
    </div>
  );
}
