import { useSchedule } from './ScheduleContext';

import './Schedule.scss';

interface ScheduleNavProps {
  className?: string;
}

export default function ScheduleNav({ className }: ScheduleNavProps) {
  const { numPages, visiblePage } = useSchedule();

  return (
    <div className={`schedule-nav ${className}`}>
      {numPages > 1 &&
        [...Array(numPages).keys()].map((i) => (
          <div
            key={i}
            className={i === visiblePage ? 'schedule-nav__item schedule-nav__item--selected' : 'schedule-nav__item'}
          />
        ))}
    </div>
  );
}
