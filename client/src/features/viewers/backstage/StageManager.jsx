import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import NavLogo from 'common/components/nav/NavLogo';
import Paginator from 'common/components/views/Paginator';
import TitleSide from 'common/components/views/TitleSide';
import { formatDisplay } from 'common/utils/dateConfig';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { getEventsWithDelay } from '../../../common/utils/eventsManager';
import { titleVariants } from '../common/animation';

import style from './StageManager.module.scss';

export default function StageManager(props) {
  const { publ, title, time, backstageEvents, selectedId, general } = props;
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
    <div className={style.container__gray}>
      <NavLogo />

      <div className={style.eventTitle}>{general.title}</div>

      <AnimatePresence>
        {title.showNow && (
          <motion.div
            className={style.nowContainer}
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
            className={style.nextContainer}
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
          setCurrentPage={setCurrentPage}
          setPageNumber={setPageNumber}
        />
      </div>

      <div className={showPubl ? style.publicContainer : style.publicContainerHidden}>
        <div className={style.label}>Public message</div>
        <div className={style.message}>{publ.text}</div>
      </div>

      <div className={style.clockContainer}>
        <div className={style.label}>Time Now</div>
        <div className={style.clock}>{time.clock}</div>
      </div>

      <div className={style.countdownContainer}>
        <div className={style.label}>Stage Timer</div>
        <div className={style.clock}>{stageTimer}</div>
      </div>

      <div className={style.infoContainer}>
        <div className={style.label}>Info</div>
        <div className={style.infoMessages}>
          <div className={style.info}>{general.backstageInfo}</div>
        </div>
        <div className={style.qr}>
          {general.url != null && general.url !== '' && (
            <QRCode value={general.url} size={window.innerWidth / 12} level='L' />
          )}
        </div>
      </div>
    </div>
  );
}

StageManager.propTypes = {
  publ: PropTypes.object,
  title: PropTypes.object,
  time: PropTypes.object,
  backstageEvents: PropTypes.object,
  selectedId: PropTypes.string,
  general: PropTypes.object,
};
