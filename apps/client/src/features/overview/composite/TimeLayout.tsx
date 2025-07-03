import { memo } from 'react';
import { Tooltip } from '@chakra-ui/react';

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

const TimeColumnComponent = ({ label, value, muted, className, testId }: TimeLayoutProps) => {
  return (
    <div className={style.column}>
      <span className={style.label}>{label}</span>
      <span className={cx([style.clock, muted && style.muted, className])} data-testid={testId}>
        {value}
      </span>
    </div>
  );
};
export const TimeColumn = memo(TimeColumnComponent);

const TimeRowComponent = ({ label, value, daySpan, muted, className }: TimeLayoutProps) => {
  return (
    <div className={style.row}>
      <span className={style.label}>{label}</span>
      {daySpan ? (
        <Tooltip label={`Event spans over ${daySpan + 1} days`}>
          <span className={cx([style.clock, style.daySpan, className])}>{value}</span>
        </Tooltip>
      ) : (
        <span className={cx([style.clock, muted && style.muted, className])}>{value}</span>
      )}
    </div>
  );
};
export const TimeRow = memo(TimeRowComponent);
