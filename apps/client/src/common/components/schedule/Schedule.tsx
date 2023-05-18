import Empty from '../state/Empty';

import { useSchedule } from './ScheduleContext';
import ScheduleItem from './ScheduleItem';

import './Schedule.scss';

interface ScheduleProps {
  className?: string;
}

export default function Schedule({ className }: ScheduleProps) {
  const { paginatedEvents, selectedEventId, isBackstage, scheduleType } = useSchedule();

  if (paginatedEvents?.length < 1) {
    return <Empty text='No events to show' />;
  }

  let selectedState: 'past' | 'now' | 'future' = 'past';

  return (
    <ul className={`schedule ${className}`}>
      {paginatedEvents.map((event) => {
        if (scheduleType === 'past' || scheduleType === 'future') {
          selectedState = scheduleType;
        } else {
          if (event.id === selectedEventId) {
            selectedState = 'now';
          } else if (selectedState === 'now') {
            selectedState = 'future';
          }
        }
        return (
          <ScheduleItem
            key={event.id}
            selected={selectedState}
            timeStart={event.timeStart}
            timeEnd={event.timeEnd}
            title={event.title}
            colour={isBackstage ? event.colour : ''}
            backstageEvent={!event.isPublic}
            skip={event.skip}
          />
        );
      })}
    </ul>
  );
}
