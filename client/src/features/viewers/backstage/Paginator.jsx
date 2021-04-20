import TodayItem from './TodayItem';
import style from './Paginator.module.css';
import { useEffect, useState } from 'react';
import { useTimeout } from '../../../app/hooks/useTimeout';
import { useInterval } from '../../../app/hooks/useInterval';

export default function Paginator(props) {
  const { events, selectedId } = props;
  const LIMIT_PER_PAGE = 3;
  const SCROLL_TIME = 5000;
  const SCROLL_PAST = false;
  const [numEvents, setNumEvents] = useState(0);
  const [page, setPage] = useState([]);
  const [pages, setPages] = useState(0);
  const [selPage, setSelPage] = useState(0);

  // Keep track of order
  // 0 - events before
  // 1 - running event
  // 2 - future event
  let selectedYet = 0;

  useEffect(() => {
    if (events == null) return;

    console.log('debug events', events);

    // how many events in list
    let n = events.length;
    setNumEvents(n);
    console.log('debug ne', n);

    // how many paginated views
    let p = Math.ceil(n / LIMIT_PER_PAGE);
    setPages(p);
    console.log('debug np', p);

    // divide events in parts of LIMIT_PER_PAGE
    const eventStart = LIMIT_PER_PAGE * selPage;
    const eventEnd = LIMIT_PER_PAGE * (selPage + 1);
    let e = events.slice(eventStart, eventEnd);
    setPage(e);
    console.log('debug show', e);

    // if array is completely in past, show depending on SCROLL_PAST
  }, [events, selPage]);

  // every SCROLL_TIME go to the next array
  useInterval(() => {
    if (numEvents > LIMIT_PER_PAGE) {
      const next = (selPage + 1) % pages;
      setSelPage(next);
    }
  }, SCROLL_TIME);

  return (
    <>
      <div className={style.nav}>
        {[...Array(pages)].map((p, i) => (
          <div
            className={i === selPage ? style.navItemSelected : style.navItem}
          />
        ))}
      </div>

      <div className={style.entries}>
        {page.map((e) => {
          if (e.id === selectedId) selectedYet = 1;
          else if (selectedYet === 1) selectedYet = 2;
          return (
            <TodayItem
              selected={selectedYet}
              timeStart={e.timeStart}
              timeEnd={e.timeEnd}
              title={e.title}
            />
          );
        })}
      </div>
    </>
  );
}
