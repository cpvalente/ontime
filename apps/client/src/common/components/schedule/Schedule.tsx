import { useSchedule } from './ScheduleContext';
import ScheduleItem from './ScheduleItem';

import './Schedule.scss';

interface ScheduleProps {
  isProduction?: boolean;
  className?: string;
}

export default function Schedule({ isProduction, className }: ScheduleProps) {
  const { paginatedEvents, selectedEventId, isBackstage, scheduleType } = useSchedule();

  // TODO: design a nice placeholder for empty schedules
  if (paginatedEvents?.length < 1) {
    return null;
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

        const timeStart = isProduction ? event.timeStart + (event?.delay ?? 0) : event.timeStart;
        const timeEnd = isProduction ? event.timeEnd + (event?.delay ?? 0) : event.timeEnd;

        return (
          <ScheduleItem
            key={event.id}
            selected={selectedState}
            timeStart={timeStart}
            timeEnd={timeEnd}
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
