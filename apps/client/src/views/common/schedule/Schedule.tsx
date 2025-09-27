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
        return <ScheduleItem key={event.id} event={event} />;
      })}
    </ul>
  );
}
