import { ReactNode } from 'react';

import { cx } from '../../../common/utils/styleUtils';

import style from './TimeLayout.module.scss';

interface TimeLayoutProps {
  label: string;
  value: string;
  state?: 'muted' | 'waiting' | 'active';
  daySpan?: number;
  className?: string;
  testId?: string;
}

export function TimeColumn({ label, value, state = 'active', className, testId }: TimeLayoutProps) {
  return (
    <div className={cx([style.column, className])} data-state={state}>
      <span className={style.label}>{label}</span>
      <span className={style.clock} data-testid={testId}>
        {value}
      </span>
    </div>
  );
}

interface WrappedInTimeColumnProps {
  label: string;
  state?: 'muted' | 'waiting' | 'active';
  className?: string;
  render: (className: string) => ReactNode;
}

export function WrappedInTimeColumn({ label, state = 'active', className, render }: WrappedInTimeColumnProps) {
  return (
    <div className={cx([style.column, className])} data-state={state}>
      <span className={style.label}>{label}</span>
      {render(style.clock)}
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
