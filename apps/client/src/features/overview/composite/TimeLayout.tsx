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

interface OverUnderProps {
  state: 'over' | 'under' | 'muted' | null;
  value: string;
  testId: string;
}

export function OverUnder({ state, value, testId }: OverUnderProps) {
  return (
    <div className={style.column} data-state={state}>
      <div className={style.label}>
        <span className={style.over}>Over</span>
        <span>/</span>
        <span className={style.under}>Under</span>
      </div>
      <span className={style.clock} data-testid={testId}>
        {value}
      </span>
    </div>
  );
}
