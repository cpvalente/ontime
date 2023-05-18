import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { OntimeEvent } from 'ontime-types';

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
  eventsPerPage?: number;
  time?: number;
}

export const ScheduleProvider = ({
  children,
  events,
  selectedEventId,
  isBackstage = false,
  eventsPerPage = 7,
  time = 10,
}: PropsWithChildren<ScheduleProviderProps>) => {
  const [visiblePage, setVisiblePage] = useState(0);

  const numPages = Math.ceil(events.length / eventsPerPage);
  const eventStart = eventsPerPage * visiblePage;
  const eventEnd = eventsPerPage * (visiblePage + 1);
  const paginatedEvents = events.slice(eventStart, eventEnd);
  const selectedEventIndex = events.findIndex((event) => event.id === selectedEventId);

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
    if (events.length > eventsPerPage) {
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
