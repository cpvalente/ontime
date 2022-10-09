import { useEffect, useState } from 'react';
import { useInterval } from 'common/hooks/useInterval';

import { OntimeEvent } from '../../application-types/event';
import Empty from '../state/Empty';

import TodayItem from './TodayItem';

import './Paginator.scss';

interface PaginatorProps {
  events: OntimeEvent[];
  selectedId: string;
  limit?: number;
  time?: number;
  isBackstage: boolean;
  setPageNumber: (page: number) => void;
  setCurrentPage: (selectedPage: number) => void;
}

export default function Paginator(props: PaginatorProps) {
  const {
    events,
    selectedId,
    limit = 8,
    time = 10,
    isBackstage,
    setPageNumber,
    setCurrentPage,
  } = props;
  const LIMIT_PER_PAGE = limit;
  const SCROLL_TIME = time * 1000;
  const [numEvents, setNumEvents] = useState(0);
  const [page, setPage] = useState<OntimeEvent[]>([]);
  const [pages, setPages] = useState<number>(0);
  const [selPage, setSelPage] = useState<number>(0);

  // keep parent up to date
  useEffect(() => {
    if (setPageNumber) {
      setPageNumber(pages);
    }
  }, [setPageNumber, pages]);

  useEffect(() => {
    if (setCurrentPage) {
      setCurrentPage(selPage);
    }
  }, [setCurrentPage, selPage]);

  useEffect(() => {
    if (events == null) return;
    // how many events in list
    const n = events.length;
    setNumEvents(n);

    // how many paginated views
    setPages(Math.ceil(n / LIMIT_PER_PAGE));

    // divide events in parts of LIMIT_PER_PAGE
    const eventStart = LIMIT_PER_PAGE * selPage;
    const eventEnd = LIMIT_PER_PAGE * (selPage + 1);
    setPage(events.slice(eventStart, eventEnd));

    // if array is completely in past, show depending on SCROLL_PAST
  }, [events, selPage, LIMIT_PER_PAGE]);

  // every SCROLL_TIME go to the next array
  useInterval(() => {
    if (numEvents > LIMIT_PER_PAGE) {
      const next = (selPage + 1) % pages;
      setSelPage(next);
    }
  }, SCROLL_TIME);

  let selectedState = 0;

  if (events?.length < 1) {
    return <Empty text='No events to show' />;
  }

  return (
    <div className='paginator entries'>
      {page.map((e) => {
        if (e.id === selectedId) selectedState = 1;
        else if (selectedState === 1) selectedState = 2;
        return (
          <TodayItem
            key={e.id}
            selected={selectedState}
            timeStart={e.timeStart}
            timeEnd={e.timeEnd}
            title={e.title}
            colour={isBackstage ? e.colour : ''}
            backstageEvent={!e.isPublic}
            skip={e.skip}
          />
        );
      })}
    </div>
  );
}
