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
  height?: string;
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
    height = '',
  } = props;

  const percentComplete = 100 - clamp(100 - (Math.max(now, 0) * 100) / complete, 0, 100);

  const dangerWidth = clamp((danger / complete) * 100, 0, 100);
  const warningWidth = clamp((warning / complete) * 100 - dangerWidth, 0, 100);
  const normalWidth = clamp(100 - (warningWidth + dangerWidth), 0, 100);

  console.log('normalWidth', normalWidth);
  console.log('warningWidth', warningWidth);
  console.log('dangerWidth', dangerWidth);

  return (
    <div
      className={`progress-bar__bg ${hidden ? 'progress-bar__bg--hidden' : ''} ${className}`}
      style={{ height: height }}
    >
      <div className='progressNormal' style={{ width: `${normalWidth}%`, backgroundColor: normalColor }} />
      <div className='progressWarning' style={{ width: `${warningWidth}%`, backgroundColor: warningColor }} />
      <div className='progressDanger' style={{ width: `${dangerWidth}%`, backgroundColor: dangerColor }} />
      <div className='progress-bar__indicator' style={{ width: `${percentComplete}%` }} />
    </div>
  );
}
