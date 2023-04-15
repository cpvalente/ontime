import { clamp } from '../../utils/math';

import './MultiPartProgressBar.scss';

interface MultiPartProgressBar {
  now?: number;
  complete?: number;
  normalColor?: string;
  warning?: number;
  warningColor?: string;
  danger?: number;
  dangerColor?: string;
  hidden?: boolean;
  className?: string;
}

export default function MultiPartProgressBar(props: MultiPartProgressBar) {
  const {
    now = 0,
    complete = 100,
    normalColor,
    warning = 85,
    warningColor,
    danger = 95,
    dangerColor,
    hidden,
    className = '',
  } = props;

  const percentComplete = 100 - clamp(100 - (Math.max(now, 0) * 100) / complete, 0, 100);

  const dangerWidth = (danger / complete) * 100;
  const warningWidth = (warning / complete) * 100 - dangerWidth;
  const normalWidth = 100 - (warningWidth + dangerWidth);

  return (
    <div className={`progress-bar__bg ${hidden ? 'progress-bar__bg--hidden' : ''} ${className}`}>
      <div className='progressNormal' style={{ width: `${normalWidth}%`, backgroundColor: normalColor }} />
      <div className='progressWarning' style={{ width: `${warningWidth}%`, backgroundColor: warningColor }} />
      <div className='progressDanger' style={{ width: `${dangerWidth}%`, backgroundColor: dangerColor }} />
      <div className='progress-bar__indicator' style={{ width: `${percentComplete}%` }} />
    </div>
  );
}
