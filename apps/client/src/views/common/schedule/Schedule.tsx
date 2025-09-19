import { cx } from '../../../common/utils/styleUtils';

import { getScheduledTimes } from './schedule.utils';
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
        const { timeStart, timeEnd, delay } = getScheduledTimes(event);

        return <ScheduleItem key={event.id} event={event} />;
      })}
    </ul>
  );
}
