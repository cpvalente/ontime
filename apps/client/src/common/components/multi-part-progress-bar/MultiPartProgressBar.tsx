import { MaybeNumber } from 'ontime-types';

import { clamp } from '../../utils/math';

import './MultiPartProgressBar.scss';

interface MultiPartProgressBar {
  now: MaybeNumber;
  complete: number;
  normalColor: string;
  warning?: MaybeNumber;
  warningColor: string;
  danger?: MaybeNumber;
  dangerColor: string;
  hidden?: boolean;
  className?: string;
}

export default function MultiPartProgressBar(props: MultiPartProgressBar) {
  const { now, complete, normalColor, warning, warningColor, danger, dangerColor, hidden, className = '' } = props;

  const percentRemaining = complete === 0 ? 0 : 100 - clamp(100 - (Math.max(now ?? 0, 0) * 100) / complete, 0, 100);

  const dangerWidth = danger ? clamp((danger / complete) * 100, 0, 100) : 0;
  const warningWidth = warning ? clamp((warning / complete) * 100 - dangerWidth, 0, 100) : 0;

  return (
    <div className={`multiprogress-bar ${hidden ? 'multiprogress-bar--hidden' : ''} ${className}`}>
      {now !== null && (
        <>
          <div className='multiprogress-bar__bg'>
            <div className='multiprogress-bar__bg-normal' style={{ backgroundColor: normalColor }} />
            <div
              className='multiprogress-bar__bg-warning'
              style={{ width: `${warningWidth}%`, backgroundColor: warningColor }}
            />
            <div
              className='multiprogress-bar__bg-danger'
              style={{ width: `${dangerWidth}%`, backgroundColor: dangerColor }}
            />
          </div>
          <div className='multiprogress-bar__indicator'>
            <div className='multiprogress-bar__indicator-bar' style={{ width: `${percentRemaining}%` }}></div>
          </div>
        </>
      )}
    </div>
  );
}
