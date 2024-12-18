import { cx } from '../../../common/utils/styleUtils';
import { Tooltip } from '../../../components/ui/tooltip';

import style from './TimeLayout.module.scss';

interface TimeLayoutProps {
  label: string;
  value: string;
  daySpan?: number;
  className?: string;
}

export function TimeColumn({ label, value, className }: TimeLayoutProps) {
  return (
    <div className={style.column}>
      <span className={style.label}>{label}</span>
      <span className={cx([style.clock, className])}>{value}</span>
    </div>
  );
}

export function TimeRow({ label, value, daySpan, className }: TimeLayoutProps) {
  return (
    <div className={style.row}>
      <span className={style.label}>{label}</span>
      {daySpan ? (
        <Tooltip content={`Event spans over ${daySpan + 1} days`}>
          <span className={cx([style.clock, style.daySpan, className])}>{value}</span>
        </Tooltip>
      ) : (
        <span className={cx([style.clock, className])}>{value}</span>
      )}
    </div>
  );
}
