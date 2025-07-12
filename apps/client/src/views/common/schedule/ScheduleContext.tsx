import {
  createContext,
  PropsWithChildren,
  RefObject,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { isOntimeEvent, OntimeEntry, OntimeEvent } from 'ontime-types';

import { usePartialRundown } from '../../../common/hooks-query/useRundown';

import { useScheduleOptions } from './schedule.options';

interface ScheduleContextState {
  events: OntimeEvent[];
  selectedEventId: string | null;
  numPages: number;
  visiblePage: number;
  containerRef: RefObject<HTMLUListElement | null>;
}

const ScheduleContext = createContext<ScheduleContextState | undefined>(undefined);

interface ScheduleProviderProps {
  selectedEventId: string | null;
}

export const ScheduleProvider = ({ children, selectedEventId }: PropsWithChildren<ScheduleProviderProps>) => {
  const { cycleInterval, stopCycle } = useScheduleOptions();
  const { data: events } = usePartialRundown((event: OntimeEntry) => {
    return isOntimeEvent(event);
  });

  const [firstIndex, setFirstIndex] = useState(-1);
  const [numPages, setNumPages] = useState(0);
  const [visiblePage, setVisiblePage] = useState(0);

  const lastIndex = useRef(-1);
  const paginator = useRef<NodeJS.Timeout>(undefined);

  const containerRef = useRef<HTMLUListElement>(null);

  // After the view is rendered, we paginate by hiding elements that dont fit
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const children = Array.from(containerRef.current.children) as HTMLElement[];
    if (children.length === 0) {
      return;
    }

    const containerHeight = containerRef.current.clientHeight;
    let currentPageHeight = 0; // used to check when we need to paginate
    let currentPage = 1;
    let numPages = 1;
    let lastVisibleIndex = -1; // keep track of last index on screen
    let isShowingElements = false;

    for (let i = 0; i < children.length; i++) {
      const currentElementHeight = children[i].clientHeight;

      // can we fit this element in the current page?
      const isNextPage = currentPageHeight + currentElementHeight > containerHeight;
      if (isNextPage) {
        currentPageHeight = 0;
        numPages += 1;
      }

      // we hide elements that are before and after the first element to show
      if (i < firstIndex) {
        hideElement(children[i]);
      } else if (lastVisibleIndex === -1) {
        isShowingElements = true;
        currentPage = numPages;
      } else if (isNextPage) {
        isShowingElements = false;
      }

      if (!isShowingElements) {
        hideElement(children[i]);
      } else {
        lastVisibleIndex = i;
        showElement(children[i], currentPageHeight);
      }

      currentPageHeight += currentElementHeight;
    }

    setVisiblePage(currentPage);
    setNumPages(numPages);
    lastIndex.current = lastVisibleIndex;

    function showElement(element: HTMLElement, yPosition: number) {
      element.style.top = `${yPosition}px`;
    }

    function hideElement(element: HTMLElement) {
      element.style.top = `${-1000}px`;
    }
    // we need to add the events to make sure the effect runs on first render
  }, [firstIndex, events]);

  // schedule cycling through events
  useEffect(() => {
    if (stopCycle) {
      setVisiblePage(1);
      setFirstIndex(0);
      return;
    }

    if (paginator.current) {
      clearInterval(paginator.current);
    }

    const interval = setInterval(() => {
      // ensure we cycle back to the first event
      if (visiblePage === numPages) {
        setFirstIndex(0);
      } else {
        setFirstIndex(lastIndex.current + 1);
      }
    }, cycleInterval * 1000);
    paginator.current = interval;

    return () => clearInterval(paginator.current);
  }, [cycleInterval, numPages, stopCycle, visiblePage]);

  let selectedEventIndex = events.findIndex((event) => event.id === selectedEventId);

  // we want to show the event after the current
  const viewEvents = events.slice(selectedEventIndex + 1);
  selectedEventIndex = 0;

  return (
    <ScheduleContext.Provider
      value={{
        events: viewEvents as OntimeEvent[],
        selectedEventId,
        numPages,
        visiblePage,
        containerRef,
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
