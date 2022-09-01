import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import NavLogo from 'common/components/nav/NavLogo';
import Paginator from 'common/components/paginator/Paginator';
import TitleSide from 'common/components/title-side/TitleSide';
import { formatDisplay } from 'common/utils/dateConfig';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { getEventsWithDelay } from '../../../common/utils/eventsManager';
import { overrideStylesURL } from '../../../ontimeConfig';
import { titleVariants } from '../common/animation';

import './Backstage.scss';

export default function Backstage(props) {
  const { publ, title, time, backstageEvents, selectedId, general, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [filteredEvents, setFilteredEvents] = useState(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Backstage Screen';
  }, []);

  // calculate delays if any
  useEffect(() => {
    if (backstageEvents == null) return;
    const f = getEventsWithDelay(backstageEvents);
    setFilteredEvents(f);
  }, [backstageEvents]);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  // Format messages
  const showPubl = publ.text !== '' && publ.visible;

  let stageTimer;
  if (time.running === null) {
    stageTimer = '- - : - -';
  } else {
    stageTimer = formatDisplay(Math.abs(time.running), true);
    if (time.isNegative) stageTimer = `-${stageTimer}`;
  }

  return (
    <div className='backstage'>
      <NavLogo />

      <div className='event-title'>{general.title}</div>

      <AnimatePresence>
        {title.showNow && (
          <motion.div
            className='event now'
            key='now'
            variants={titleVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
          >
            <TitleSide
              label='Now'
              type='now'
              title={title.titleNow}
              subtitle={title.subtitleNow}
              presenter={title.presenterNow}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {title.showNext && (
          <motion.div
            className='event next'
            key='next'
            variants={titleVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
          >
            <TitleSide
              label='Next'
              type='next'
              title={title.titleNext}
              subtitle={title.subtitleNext}
              presenter={title.presenterNext}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
          setCurrentPage={setCurrentPage}
          setPageNumber={setPageNumber}
        />
      </div>

      <div className={showPubl ? 'public-container' : 'public-container public-container--hidden'}>
        <div className='label'>Public message</div>
        <div className='message'>{publ.text}</div>
      </div>

      <div className='clock-container'>
        <div className='label'>Time Now</div>
        <div className='clock'>{time.clock}</div>
      </div>

      <div className='timer-container'>
        <div className='label'>Stage Timer</div>
        <div className='timer'>{stageTimer}</div>
      </div>

      <div className='info'>
        <div className='label'>Info</div>
        <div className='info__message'>{general.backstageInfo}</div>
        <div className='qr'>
          {general.url != null && general.url !== '' && (
            <QRCode value={general.url} size={window.innerWidth / 12} level='L' />
          )}
        </div>
      </div>
    </div>
  );
}

Backstage.propTypes = {
  publ: PropTypes.object,
  title: PropTypes.object,
  time: PropTypes.object,
  backstageEvents: PropTypes.object,
  selectedId: PropTypes.string,
  general: PropTypes.object,
  viewSettings: PropTypes.object,
};
