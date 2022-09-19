import { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { ReactComponent as Emptyimage } from 'assets/images/empty.svg';
import NavLogo from 'common/components/nav/NavLogo';
import Paginator from 'common/components/paginator/Paginator';
import { formatDisplay } from 'common/utils/dateConfig';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { formatTime } from '../../../common/utils/time';

import './Pip.scss';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

export default function Pip(props) {
  const { time, backstageEvents, selectedId, general, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const ref = useRef(null);
  const [filteredEvents, setFilteredEvents] = useState(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

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

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  // Format messages
  const showInfo = general.backstageInfo !== '' && general.backstageInfo != null;
  let stageTimer = formatDisplay(Math.abs(time.running), true);
  if (time.isNegative) stageTimer = `-${stageTimer}`;

  const clock = formatTime(time.clock, formatOptions);

  return (
    <div className='pip'>
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

      <div className='pip-placeholder' ref={ref}>
        <Emptyimage className='pip-placeholder__empty' />
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div className='info-container'>
            <div className='label'>Info</div>
            <div className='info-message'>{general.backstageInfo}</div>
            <div className='qr'>
              {general.url != null && general.url !== '' && (
                <QRCode value={general.url} size={window.innerWidth / 12} level='L' />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className='clock-container'>
        <div className='label'>Time Now</div>
        <div className='clock'>{clock}</div>
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
  viewSettings: PropTypes.object,
};
