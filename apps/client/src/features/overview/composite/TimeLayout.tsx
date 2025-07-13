import { PropsWithChildren } from 'react';

import Tooltip from '../../../common/components/tooltip/Tooltip';
import { cx } from '../../../common/utils/styleUtils';

import style from './TimeLayout.module.scss';

interface TimeLayoutProps {
  label: string;
  value: string;
  muted?: boolean;
  daySpan?: number;
  className?: string;
  testId?: string;
}

export function TimeColumn({ label, value, muted, className, testId }: TimeLayoutProps) {
  return (
    <div className={style.column}>
      <span className={style.label}>{label}</span>
      <span className={cx([style.clock, muted && style.muted, className])} data-testid={testId}>
        {value}
      </span>
    </div>
  );
}

export function TimeRow({ label, value, daySpan, muted, className }: TimeLayoutProps) {
  return (
    <div className={style.row}>
      <span className={style.label}>{label}</span>
      {daySpan ? (
        <Tooltip
          text={`Event spans over ${daySpan + 1} days`}
          render={<span />}
          className={cx([style.clock, style.daySpan, className])}
        >
          {value}
        </Tooltip>
      ) : (
        <span className={cx([style.clock, muted && style.muted, className])}>{value}</span>
      )}
    </div>
  );
}

export function TimeElementsRow({ label, value, daySpan, muted, className }: PropsWithChildren<TimeLayoutProps>) {
  return (
    <div className={style.row}>
      <span className={style.label}>{label}</span>
      {daySpan ? (
        <Tooltip
          text={`Event spans over ${daySpan + 1} days`}
          render={<span />}
          className={cx([style.clock, style.daySpan, className])}
        >
          {value}
        </Tooltip>
      ) : (
        <span className={cx([style.clock, muted && style.muted, className])}>{value}</span>
      )}
    </div>
  );
}
