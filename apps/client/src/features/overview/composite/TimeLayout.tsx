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
  onClick?: () => void;
}

export function TimeColumn({ label, value, muted, className, testId, onClick }: TimeLayoutProps) {
  return (
    <div className={cx([style.column, onClick ? style.clickable : ''])} onClick={onClick}>
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
