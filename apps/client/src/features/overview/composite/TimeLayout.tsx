import { cx } from '../../../common/utils/styleUtils';

import style from './TimeLayout.module.scss';

interface TimeLayoutProps {
  label: string;
  value: string;
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

export function TimeRow({ label, value, className }: TimeLayoutProps) {
  return (
    <div className={style.row}>
      <span className={style.label}>{label}</span>
      <span className={cx([style.clock, className])}>{value}</span>
    </div>
  );
}
