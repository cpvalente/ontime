import Empty from '../state/Empty';

import { useSchedule } from './ScheduleContext';
import ScheduleItem from './ScheduleItem';

import './Schedule.scss';

interface ScheduleProps {
  className?: string;
}

export default function Schedule({ className }: ScheduleProps) {
  const { paginatedEvents, selectedEventId, isBackstage } = useSchedule();

  if (paginatedEvents?.length < 1) {
    return <Empty text='No events to show' />;
  }

  let selectedState: 'past' | 'now' | 'future' = 'past';
  const selectedEvent = paginatedEvents.find((event) => event.id === selectedEventId);

  return (
    <ul className={`schedule ${className}`}>
      {selectedEvent && (
        <ScheduleItem
          key={selectedEvent.id}
          selected='now'
          timeStart={selectedEvent.timeStart}
          timeEnd={selectedEvent.timeEnd}
          title={selectedEvent.title}
          presenter={selectedEvent.presenter}
          colour={isBackstage ? selectedEvent.colour : ''}
          backstageEvent={!selectedEvent.isPublic}
          skip={selectedEvent.skip}
        />
      )}
      {paginatedEvents.map((event) => {
        if (event.id === selectedEventId) {
          selectedState = 'now';
        } else if (selectedState === 'now') {
          selectedState = 'future';
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
