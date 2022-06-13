import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import NavLogo from 'common/components/nav/NavLogo';
import Paginator from 'common/components/views/Paginator';
import TitleSide from 'common/components/views/TitleSide';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { titleVariants } from '../common/animation';

import style from './Public.module.scss';

export default function Public(props) {
  const { publ, publicTitle, time, events, publicSelectedId, general } = props;
  const [pageNumber, setPageNumber] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Public Screen';
  }, []);

  // Format messages
  const showPubl = publ.text !== '' && publ.visible;

  // motion

  return (
    <div className={style.container__gray}>
      <NavLogo />

      <div className={style.eventTitle}>{general.title}</div>

      <AnimatePresence>
        {publicTitle.showNow && (
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
              title={publicTitle.titleNow}
              subtitle={publicTitle.subtitleNow}
              presenter={publicTitle.presenterNow}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {publicTitle.showNext && (
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
              title={publicTitle.titleNext}
              subtitle={publicTitle.subtitleNext}
              presenter={publicTitle.presenterNext}
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
          selectedId={publicSelectedId}
          events={events}
          isBackstage
          setCurrentPage={setCurrentPage}
          setPageNumber={setPageNumber}
        />
      </div>

      <div
        className={
          showPubl ? style.publicContainer : style.publicContainerHidden
        }
      >
        <div className={style.label}>Public message</div>
        <div className={style.message}>{publ.text}</div>
      </div>

      <div className={style.clockContainer}>
        <div className={style.label}>Time Now</div>
        <div className={style.clock}>{time.clock}</div>
      </div>

      <div className={style.infoContainer}>
        <div className={style.label}>Info</div>
        <div className={style.infoMessages}>
          <div className={style.info}>{general.publicInfo}</div>
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
      </div>
    </div>
  );
}

Public.propTypes = {
  publ: PropTypes.object,
  publicTitle: PropTypes.object,
  time: PropTypes.object,
  events: PropTypes.object,
  publicSelectedId: PropTypes.string,
  general: PropTypes.object,
};
