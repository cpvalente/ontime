import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import NavLogo from 'common/components/nav/NavLogo';
import TitleSide from 'common/components/title-side/TitleSide';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import Paginator from '../../../common/components/paginator/Paginator';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { formatTime } from '../../../common/utils/time';
import { titleVariants } from '../common/animation';

import './Public.scss';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

export default function Public(props) {
  const { publ, publicTitle, time, events, publicSelectedId, general, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [pageNumber, setPageNumber] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    document.title = 'ontime - Public Screen';
  }, []);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  // Format messages
  const showPubl = publ.text !== '' && publ.visible;
  const clock = formatTime(time.clock, formatOptions);

  return (
    <div className='public-screen'>
      <NavLogo />

      <div className='event-title'>{general.title}</div>

      <AnimatePresence>
        {publicTitle.showNow && (
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
              title={publicTitle.titleNext}
              subtitle={publicTitle.subtitleNext}
              presenter={publicTitle.presenterNext}
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
          selectedId={publicSelectedId}
          events={events}
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
        <div className='clock'>{clock}</div>
      </div>

      <div className='info'>
        <div className='label'>Info</div>
        <div className='info__message'>{general.publicInfo}</div>
        <div className='qr'>
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
  events: PropTypes.array,
  publicSelectedId: PropTypes.string,
  general: PropTypes.object,
  viewSettings: PropTypes.object,
};
