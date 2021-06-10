import TodayItem from './TodayItem';
import style from './Paginator.module.css';
import { useEffect, useState } from 'react';
import { useInterval } from 'app/hooks/useInterval';

export default function Paginator(props) {
  const { events, selectedId } = props;
  const LIMIT_PER_PAGE = props.limit || 8;
  const SCROLL_TIME = props.time * 1000 || 10000;
  const SCROLL_PAST = false;
  const [numEvents, setNumEvents] = useState(0);
  const [page, setPage] = useState([]);
  const [pages, setPages] = useState(0);
  const [selPage, setSelPage] = useState(0);

  useEffect(() => {
    if (events == null) return;
    // how many events in list
    let n = events.length;
    setNumEvents(n);

    // how many paginated views
    let p = Math.ceil(n / LIMIT_PER_PAGE);
    setPages(p);

    // divide events in parts of LIMIT_PER_PAGE
    const eventStart = LIMIT_PER_PAGE * selPage;
    const eventEnd = LIMIT_PER_PAGE * (selPage + 1);
    let e = events.slice(eventStart, eventEnd);
    setPage(e);

    // if array is completely in past, show depending on SCROLL_PAST
  }, [events, selPage, LIMIT_PER_PAGE]);

  console.log('debug events', events);

  // every SCROLL_TIME go to the next array
  useInterval(() => {
    if (numEvents > LIMIT_PER_PAGE) {
      const next = (selPage + 1) % pages;
      setSelPage(next);
    }
  }, SCROLL_TIME);

  let selectedState = 0;

  return (
    <>
      <div className={style.nav}>
        {pages > 1 &&
          [...Array(pages)].map((p, i) => (
            <div
              key={i}
              className={i === selPage ? style.navItemSelected : style.navItem}
            />
          ))}
      </div>
      <div className={style.entries}>
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
              backstageEvent={!e.isPublic}
            />
          );
        })}
      </div>
    </>
  );
}
