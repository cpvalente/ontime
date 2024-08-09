import { MaybeNumber } from 'ontime-types';

import { getProgress } from '../../utils/getProgress';

import './MultiPartProgressBar.scss';

interface MultiPartProgressBar {
  now: MaybeNumber;
  complete: MaybeNumber;
  normalColor: string;
  warning?: MaybeNumber;
  warningColor: string;
  danger?: MaybeNumber;
  dangerColor: string;
  hidden?: boolean;
  ignoreCssOverride?: boolean;
  className?: string;
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
    ignoreCssOverride,
    className = '',
  } = props;

  const percentRemaining = 100 - getProgress(now, complete);
  const dangerWidth = danger ? 100 - getProgress(danger, complete) : 0;
  const warningWidth = warning ? 100 - dangerWidth - getProgress(warning, complete) : 0;

  return (
    <div
      className={`multiprogress-bar ${hidden ? 'multiprogress-bar--hidden' : ''} ${
        ignoreCssOverride ? 'multiprogress-bar--ignore-css-override' : ''
      } ${className}`}
    >
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
            <div className='multiprogress-bar__indicator-bar' style={{ width: `${percentRemaining}%` }} />
          </div>
        </>
      )}
    </div>
  );
}
