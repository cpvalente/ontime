import { cx } from '../../../common/utils/styleUtils';

import { useSchedule } from './ScheduleContext';
import ScheduleItem from './ScheduleItem';

import './Schedule.scss';

interface ScheduleProps {
  className?: string;
}

export default function Schedule({ className }: ScheduleProps) {
  const { events, containerRef } = useSchedule();

  if (events?.length < 1) {
    return null;
  }

  return (
    <ul className={cx(['schedule', className])} ref={containerRef}>
      {events.map((event) => {
        return (
          <ScheduleItem
            key={event.id}
            timeStart={event.timeStart}
            timeEnd={event.timeEnd}
            title={event.title}
            colour={event.colour}
            skip={event.skip}
            delay={event.skip ? 0 : event.delay}
          />
        );
      })}
    </ul>
  );
}
