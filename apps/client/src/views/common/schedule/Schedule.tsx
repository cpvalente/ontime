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
            dayOffset={event.dayOffset}
            delay={event.delay}
            totalGap={event.totalGap}
            isLinkedToLoaded={event.isLinkedToLoaded}
            countToEnd={event.countToEnd}
            duration={event.duration}
            colour={event.colour}
            skip={event.skip}
            title={event.title}
            timeEnd={event.timeEnd}
          />
        );
      })}
    </ul>
  );
}
