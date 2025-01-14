import { Tooltip } from '../../../common/components/ui/tooltip';
import { cx } from '../../../common/utils/styleUtils';

import style from './TimeLayout.module.scss';

interface TimeLayoutProps {
  label: string;
  value: string;
  muted?: boolean;
  daySpan?: number;
  className?: string;
}

export function TimeColumn({ label, value, muted, className }: TimeLayoutProps) {
  return (
    <div className={style.column}>
      <span className={style.label}>{label}</span>
      <span className={cx([style.clock, muted && style.muted, className])}>{value}</span>
    </div>
  );
}

export function TimeRow({ label, value, daySpan, muted, className }: TimeLayoutProps) {
  return (
    <div className={style.row}>
      <span className={style.label}>{label}</span>
      {daySpan ? (
        <Tooltip content={`Event spans over ${daySpan + 1} days`}>
          <span className={cx([style.clock, style.daySpan, className])}>{value}</span>
        </Tooltip>
      ) : (
        <span className={cx([style.clock, muted && style.muted, className])}>{value}</span>
      )}
    </div>
  );
}
