import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OntimeEvent } from 'ontime-types';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';
import { useInterval } from '../../hooks/useInterval';

interface ScheduleContextState {
  events: OntimeEvent[];
  paginatedEvents: OntimeEvent[];
  selectedEventId: string | null;
  scheduleType: 'past' | 'now' | 'future';
  numPages: number;
  visiblePage: number;
  isBackstage: boolean;
}

const ScheduleContext = createContext<ScheduleContextState | undefined>(undefined);

interface ScheduleProviderProps {
  events: OntimeEvent[];
  selectedEventId: string | null;
  isBackstage?: boolean;
  time?: number;
}

const numEventsPerPage = 10;

export const ScheduleProvider = ({
  children,
  events,
  selectedEventId,
  isBackstage = false,
  time = 10,
}: PropsWithChildren<ScheduleProviderProps>) => {
  const [visiblePage, setVisiblePage] = useState(0);
  const [searchParams] = useSearchParams();

  // look for overrides from views
  const hidePast = isStringBoolean(searchParams.get('hidePast'));
  const stopCycle = isStringBoolean(searchParams.get('stopCycle'));
  const eventsPerPage = Number(searchParams.get('eventsPerPage') ?? numEventsPerPage);

  let selectedEventIndex = events.findIndex((event) => event.id === selectedEventId);

  const viewEvents = [...events];
  if (hidePast) {
    // we want to show the event after the next
    viewEvents.splice(0, selectedEventIndex + 2);
    selectedEventIndex = 0;
  }

  const numPages = Math.ceil(viewEvents.length / eventsPerPage);
  const eventStart = eventsPerPage * visiblePage;
  const eventEnd = eventsPerPage * (visiblePage + 1);
  const paginatedEvents = viewEvents.slice(eventStart, eventEnd);

  const resolveScheduleType = () => {
    if (selectedEventIndex >= eventStart && selectedEventIndex < eventEnd) {
      return 'now';
    }
    if (selectedEventIndex > eventEnd) {
      return 'past';
    }
    return 'future';
  };
  const scheduleType = resolveScheduleType();

  // every SCROLL_TIME go to the next array
  useInterval(() => {
    if (stopCycle) {
      setVisiblePage(0);
    } else if (events.length > eventsPerPage) {
      const next = (visiblePage + 1) % numPages;
      setVisiblePage(next);
    }
  }, time * 1000);

  return (
    <ScheduleContext.Provider
      value={{
        events,
        paginatedEvents,
        selectedEventId,
        scheduleType,
        numPages,
        visiblePage,
        isBackstage,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule() can only be used inside a ScheduleContext');
  }
  return context;
};
