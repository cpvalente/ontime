import { cx } from '../../../common/utils/styleUtils';

import { getScheduledTimes } from './schedule.utils';
import { useSchedule } from './ScheduleContext';
import ScheduleItem from './ScheduleItem';

import './Schedule.scss';

interface ScheduleProps {
  isProduction?: boolean;
  className?: string;
}

export default function Schedule({ isProduction, className }: ScheduleProps) {
  const { events, isBackstage, containerRef } = useSchedule();

  if (events?.length < 1) {
    return null;
  }

  return (
    <ul className={cx(['schedule', className])} ref={containerRef}>
      {events.map((event) => {
        const { timeStart, timeEnd, delay } = getScheduledTimes(event, isProduction);

        return (
          <ScheduleItem
            key={event.id}
            timeStart={timeStart}
            timeEnd={timeEnd}
            title={event.title}
            colour={isBackstage ? event.colour : undefined}
            backstageEvent={!event.isPublic}
            skip={event.skip}
            delay={delay}
          />
        );
      })}
    </ul>
  );
}
