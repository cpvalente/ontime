import React, { useEffect, useState } from 'react';
import TodayItem from './TodayItem';
import style from './Paginator.module.css';
import { useInterval } from 'app/hooks/useInterval';
import PropTypes from 'prop-types';

export default function Paginator(props) {
  const { events, selectedId, limit = 7, time = 10, isBackstage } = props;
  const LIMIT_PER_PAGE = limit;
  const SCROLL_TIME = time * 1000 || 10000;
  const [numEvents, setNumEvents] = useState(0);
  const [page, setPage] = useState([]);
  const [pages, setPages] = useState(0);
  const [selPage, setSelPage] = useState(0);

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

  return (
    <>
      <div className={style.nav}>
        {pages > 1 &&
          [...Array(pages).keys()].map((i) => (
            <div key={i} className={i === selPage ? style.navItemSelected : style.navItem} />
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
              colour={isBackstage ? e.colour : ''}
              backstageEvent={!e.isPublic}
            />
          );
        })}
      </div>
    </>
  );
}

Paginator.propTypes = {
  events: PropTypes.array,
  selectedId: PropTypes.string,
  limit: PropTypes.number,
  time: PropTypes.number,
  isBackstage: PropTypes.bool,
};
