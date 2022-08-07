import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';
import NavLogo from 'common/components/nav/NavLogo';
import Paginator from 'common/components/views/Paginator';
import TitleSide from 'common/components/views/TitleSide';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { formatTime } from '../../../common/utils/time';
import { titleVariants } from '../common/animation';

import style from './Public.module.scss';

export default function Public(props) {
  const { publ, publicTitle, time, events, publicSelectedId, general, settings } = props;
  const [pageNumber, setPageNumber] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [localTimeFormat, setLocalTimeFormat] = useState(null);
  const [searchParams] = useSearchParams();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Public Screen';
  }, []);

  // eg. http://localhost:3000/public?fprmat=12
  // Check for user options
  useEffect(() => {
    // format: selector
    // Should be '12' or '24'
    const format = searchParams.get('format');
    if (format === '12' || format === '24') {
      setLocalTimeFormat(format);
    }
  }, [searchParams]);

  // Format messages
  const showPubl = publ.text !== '' && publ.visible;

  const clock = useMemo(() => {
    const formatOptions = {
      showSeconds: true,
      format: 'hh:mm:ss aa',
    };
    return localTimeFormat
      ? formatTime(time.clock, localTimeFormat === '12', formatOptions)
      : formatTime(time.clock, settings.timeFormat === '12', formatOptions);
  }, [localTimeFormat, settings.timeFormat, time.clock]);

  const format12 = useMemo(() => {
    if (localTimeFormat) {
      return localTimeFormat === '12';
    } else if (settings.timeFormat) {
      return settings.timeFormat === '12';
    }
    return false;
  }, [localTimeFormat, settings.timeFormat]);

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
          format12={format12}
        />
      </div>

      <div className={showPubl ? style.publicContainer : style.publicContainerHidden}>
        <div className={style.label}>Public message</div>
        <div className={style.message}>{publ.text}</div>
      </div>

      <div className={style.clockContainer}>
        <div className={style.label}>Time Now</div>
        <div className={style.clock}>{clock}</div>
      </div>

      <div className={style.infoContainer}>
        <div className={style.label}>Info</div>
        <div className={style.infoMessages}>
          <div className={style.info}>{general.publicInfo}</div>
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

Public.propTypes = {
  publ: PropTypes.object,
  publicTitle: PropTypes.object,
  time: PropTypes.object,
  events: PropTypes.object,
  publicSelectedId: PropTypes.string,
  general: PropTypes.object,
  settings: PropTypes.object,
};
