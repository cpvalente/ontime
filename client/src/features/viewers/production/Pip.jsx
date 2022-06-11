import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { ReactComponent as Emptyimage } from 'assets/images/empty.svg';
import NavLogo from 'common/components/nav/NavLogo';
import Paginator from 'common/components/views/Paginator';
import { formatDisplay } from 'common/utils/dateConfig';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import style from './Pip.module.scss';

export default function Pip(props) {
  const { time, backstageEvents, selectedId, general } = props;
  const [size, setSize] = useState('');
  const ref = useRef(null);
  const [filteredEvents, setFilteredEvents] = useState(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // calculcate pip size
  useLayoutEffect(() => {
    const h = ref.current.clientHeight;
    const w = ref.current.clientWidth;
    setSize(`${w} x ${h}`);
  }, []);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Pip';
  }, []);

  // calculate delays if any
  useEffect(() => {
    if (backstageEvents == null) return;

    const events = [...backstageEvents];

    // Add running delay
    let delay = 0;
    for (const e of events) {
      if (e.type === 'block') delay = 0;
      else if (e.type === 'delay') delay = delay + e.duration;
      else if (e.type === 'event' && delay > 0) {
        e.timeStart += delay;
        e.timeEnd += delay;
      }
    }

    // filter just events
    setFilteredEvents(events.filter((e) => e.type === 'event'));
  }, [backstageEvents]);

  // Format messages
  const showInfo =
    general.backstageInfo !== '' && general.backstageInfo != null;
  let stageTimer = formatDisplay(Math.abs(time.running), true);
  if (time.isNegative) stageTimer = `-${stageTimer}`;

  return (
    <div className={style.container__gray}>
      <NavLogo />

      <div className={style.eventTitle}>{general.title}</div>

      <div className={style.todayContainer}>
        <div className={style.todayHeaderBlock}>
          <div className={style.label}>Today</div>
          <div className={style.nav}>
            {pageNumber > 1 &&
            [...Array(pageNumber).keys()].map((i) => (
              <div
                key={i}
                className={i === currentPage ? style.navItemSelected : style.navItem}
              />
            ))}
          </div>
        </div>
        <Paginator
          selectedId={selectedId}
          events={filteredEvents}
          isBackstage
          limit={14}
          time={20}
          setCurrentPage={setCurrentPage}
          setPageNumber={setPageNumber}
        />
      </div>

      <div className={style.pip} ref={ref}>
        <Emptyimage className={style.empty} />
        <span className={style.piptext}>{size}</span>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div className={style.infoContainer}>
            <div className={style.label}>Info</div>
            <div className={style.infoMessages}>
              <div className={style.info}>{general.backstageInfo}</div>
            </div>
            <div className={style.qr}>
              {general.url != null && general.url !== '' && (
                <QRCode
                  value={general.url}
                  size={window.innerWidth / 12}
                  level='L'
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={style.clockContainer}>
        <div className={style.label}>Time Now</div>
        <div className={style.clock}>{time.clock}</div>
      </div>

      <div className={style.countdownContainer}>
        <div className={style.label}>Stage Timer</div>
        <div className={style.clock}>{stageTimer}</div>
      </div>
    </div>
  );
}

Pip.propTypes = {
  time: PropTypes.object,
  backstageEvents: PropTypes.object,
  selectedId: PropTypes.string,
  general: PropTypes.object,
};
