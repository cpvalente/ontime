import { useEffect } from 'react';
import QRCode from 'react-qr-code';
import { formatDisplay, millisToSeconds } from 'common/utils/dateConfig';
import { AnimatePresence, motion } from 'framer-motion';
import { useAtom } from 'jotai';
import PropTypes from 'prop-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import { mirrorViewersAtom } from '../../../common/atoms/ViewerSettings';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import ProgressBar from '../../../common/components/progress-bar/ProgressBar';
import Schedule from '../../../common/components/schedule/Schedule';
import { ScheduleProvider } from '../../../common/components/schedule/ScheduleContext';
import ScheduleNav from '../../../common/components/schedule/ScheduleNav';
import TitleCard from '../../../common/components/title-card/TitleCard';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { getEventsWithDelay } from '../../../common/utils/eventsManager';
import { formatTime } from '../../../common/utils/time';
import { titleVariants } from '../common/animation';

import './Backstage.scss';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

Backstage.propTypes = {
  publ: PropTypes.object,
  title: PropTypes.object,
  time: PropTypes.object,
  backstageEvents: PropTypes.array,
  selectedId: PropTypes.string,
  general: PropTypes.object,
  viewSettings: PropTypes.object,
};

// @ts-expect-error unable to type just yet
export default function Backstage(props) {
  const { publ, title, time, backstageEvents, selectedId, general, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [isMirrored] = useAtom(mirrorViewersAtom);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Backstage Screen';
  }, []);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  const clock = formatTime(time.clock, formatOptions);
  const startedAt = formatTime(time.startedAt, formatOptions);
  const expectedFinish = formatTime(time.expectedFinish, formatOptions);

  const normalisedTime = Math.max(time.current, 0);
  const qrSize = Math.max(window.innerWidth / 15, 128);
  const filteredEvents = getEventsWithDelay(backstageEvents);
  const showPublicMessage = publ.text && publ.visible;

  let stageTimer;
  if (time.current === null) {
    stageTimer = '- - : - -';
  } else {
    stageTimer = formatDisplay(Math.abs(millisToSeconds(time.current)), true);
    if (time.current < 0) {
      stageTimer = `-${stageTimer}`;
    }
  }

  return (
    <div className={`backstage ${isMirrored ? 'mirror' : ''}`} data-testid='backstage-view'>
      <NavigationMenu />

      <div className='event-header'>
        {general.title}
        <div className='clock-container'>
          <div className='label'>Time Now</div>
          <div className='time'>{clock}</div>
        </div>
      </div>

      <ProgressBar
        className='progress-container'
        now={normalisedTime}
        complete={time.duration}
      />

      <div className='now-container'>
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
              <TitleCard
                label='now'
                title={title.titleNow}
                subtitle={title.subtitleNow}
                presenter={title.presenterNow}
              />
              <div className='timer-group'>
                <div className='aux-timers'>
                  <div className='aux-timers__label'>Started At</div>
                  <div className='aux-timers__value'>{startedAt}</div>
                </div>
                <div className='aux-timers'>
                  <div className='aux-timers__label'>Expected Finish</div>
                  <div className='aux-timers__value'>{expectedFinish}</div>
                </div>
                <div className='aux-timers'>
                  <div className='aux-timers__label'>Stage Timer</div>
                  <div className='aux-timers__value'>{stageTimer}</div>
                </div>
              </div>
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
              <TitleCard
                label='next'
                title={title.titleNext}
                subtitle={title.subtitleNext}
                presenter={title.presenterNext}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScheduleProvider
        events={filteredEvents}
        selectedEventId={selectedId}
        isBackstage
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
