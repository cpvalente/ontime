import { useEffect } from 'react';
import QRCode from 'react-qr-code';
import { AnimatePresence, motion } from 'framer-motion';
import { useAtom } from 'jotai';
import PropTypes from 'prop-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import { mirrorViewersAtom } from '../../../common/atoms/ViewerSettings';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import Schedule from '../../../common/components/schedule/Schedule';
import { ScheduleProvider } from '../../../common/components/schedule/ScheduleContext';
import ScheduleNav from '../../../common/components/schedule/ScheduleNav';
import TitleCard from '../../../common/components/title-card/TitleCard';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { formatTime } from '../../../common/utils/time';
import { titleVariants } from '../common/animation';

import './Public.scss';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

Public.propTypes = {
  publ: PropTypes.object,
  publicTitle: PropTypes.object,
  time: PropTypes.object,
  events: PropTypes.array,
  publicSelectedId: PropTypes.string,
  general: PropTypes.object,
  viewSettings: PropTypes.object,
};

// @ts-expect-error unable to type just yet
export default function Public(props) {
  const { publ, publicTitle, time, events, publicSelectedId, general, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [isMirrored] = useAtom(mirrorViewersAtom);

  useEffect(() => {
    document.title = 'ontime - Public Screen';
  }, []);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  const showPublicMessage = publ.text && publ.visible;
  const clock = formatTime(time.clock, formatOptions);
  const qrSize = Math.max(window.innerWidth / 15, 128);

  return (
    <div className={`public-screen ${isMirrored ? 'mirror' : ''}`} data-testid='public-view'>
      <NavigationMenu />

      <div className='event-header'>
        {general.title}
        <div className='clock-container'>
          <div className='label'>Time Now</div>
          <div className='time'>{clock}</div>
        </div>
      </div>

      <div className='now-container'>

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
              <TitleCard
                label='now'
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
              <TitleCard
                label='next'
                title={publicTitle.titleNext}
                subtitle={publicTitle.subtitleNext}
                presenter={publicTitle.presenterNext}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScheduleProvider
        events={events}
        selectedEventId={publicSelectedId}
      >
        <ScheduleNav className='schedule-nav-container' />
        <Schedule className='schedule-container' />
      </ScheduleProvider>

      <div
        className={showPublicMessage ? 'public-container' : 'public-container public-container--hidden'}>
        <div className='label'>Public message</div>
        <div className='message'>{publ.text}</div>
      </div>

      <div className='info'>
        <div className='qr'>
          {general.url != null && general.url !== '' && (
            <QRCode value={general.url} size={qrSize} level='L' />
          )}
        </div>
        {general.backstageInfo && (
          <div className='info__message'>{general.backstageInfo}</div>
        )}
      </div>
    </div>
  );
}
