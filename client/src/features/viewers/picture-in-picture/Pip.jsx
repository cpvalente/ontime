import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { ReactComponent as Emptyimage } from 'assets/images/empty.svg';
import NavLogo from 'common/components/nav/NavLogo';
import Paginator from 'common/components/views/Paginator';
import { formatDisplay } from 'common/utils/dateConfig';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import './Pip.scss';

export default function Pip(props) {
  const { time, backstageEvents, selectedId, general } = props;
  const [size, setSize] = useState('');
  const ref = useRef(null);
  const [filteredEvents, setFilteredEvents] = useState(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // calculate pip size
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
    <div className='container pip'>
      <NavLogo />

      <div className='event-title'>{general.title}</div>

      <div className='today-container'>
        <div className='today-header-block'>
          <div className='label'>Today</div>
          <div className='nav'>
            {pageNumber > 1 &&
            [...Array(pageNumber).keys()].map((i) => (
              <div
                key={i}
                className={i === currentPage ? 'nav-item nav-item--selected' : 'nav-item'}
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

      <div className='pip' ref={ref}>
        <Emptyimage className='pip__empty' />
        <span className='pip__text'>{size}</span>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div className='info-container'>
            <div className='label'>Info</div>
            <div className='info-message'>
              {general.backstageInfo}
            </div>
            <div className='qr'>
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

      <div className='clock-container'>
        <div className='label'>Time Now</div>
        <div className='clock'>{time.clock}</div>
      </div>

      <div className='timer-container'>
        <div className='label'>Stage Timer</div>
        <div className='timer'>{stageTimer}</div>
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
