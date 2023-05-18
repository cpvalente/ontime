import { useEffect } from 'react';
import QRCode from 'react-qr-code';
import { AnimatePresence, motion } from 'framer-motion';
import { EventData, Message, OntimeEvent, ViewSettings } from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import ProgressBar from '../../../common/components/progress-bar/ProgressBar';
import Schedule from '../../../common/components/schedule/Schedule';
import { ScheduleProvider } from '../../../common/components/schedule/ScheduleContext';
import ScheduleNav from '../../../common/components/schedule/ScheduleNav';
import TitleCard from '../../../common/components/title-card/TitleCard';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { TimeManagerType } from '../../../common/models/TimeManager.type';
import { formatDisplay } from '../../../common/utils/dateConfig';
import { getEventsWithDelay } from '../../../common/utils/eventsManager';
import { formatTime } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';
import { titleVariants } from '../common/animation';
import { TitleManager } from '../ViewWrapper';

import './Backstage.scss';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

interface BackstageProps {
  isMirrored: boolean;
  publ: Message;
  title: TitleManager;
  time: TimeManagerType;
  backstageEvents: OntimeEvent[];
  selectedId: string | null;
  general: EventData;
  viewSettings: ViewSettings;
}

export default function Backstage(props: BackstageProps) {
  const { isMirrored, publ, title, time, backstageEvents, selectedId, general, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const { getLocalizedString } = useTranslation();

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
  const isNegative = (time.current ?? 0) < 0;
  const expectedFinish = isNegative ? 'In overtime' : formatTime(time.expectedFinish, formatOptions);

  const qrSize = Math.max(window.innerWidth / 15, 128);
  const filteredEvents = getEventsWithDelay(backstageEvents);
  const showPublicMessage = publ.text && publ.visible;
  const showProgress = time.playback !== 'stop';

  let stageTimer;
  if (time.current === null) {
    stageTimer = '- - : - -';
  } else {
    stageTimer = formatDisplay(Math.abs(time.current), true);
    if (isNegative) {
      stageTimer = `-${stageTimer}`;
    }
  }

  return (
    <div className={`backstage ${isMirrored ? 'mirror' : ''}`} data-testid='backstage-view'>
      <NavigationMenu />

      <div className='event-header'>
        {general.title}
        <div className='clock-container'>
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <div className='time'>{clock}</div>
        </div>
      </div>

      <ProgressBar
        className='progress-container'
        now={time.current ?? undefined}
        complete={time.duration ?? undefined}
        hidden={!showProgress}
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
                  <div className='aux-timers__label'>{getLocalizedString('common.started_at')}</div>
                  <div className='aux-timers__value'>{startedAt}</div>
                </div>
                <div className='aux-timers'>
                  <div className='aux-timers__label'>{getLocalizedString('common.expected_finish')}</div>
                  <div className='aux-timers__value'>{expectedFinish}</div>
                </div>
                <div className='aux-timers'>
                  <div className='aux-timers__label'>{getLocalizedString('common.stage_timer')}</div>
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

      <ScheduleProvider events={filteredEvents} selectedEventId={selectedId} isBackstage>
        <ScheduleNav className='schedule-nav-container' />
        <Schedule className='schedule-container' />
      </ScheduleProvider>

      <div className={showPublicMessage ? 'public-container' : 'public-container public-container--hidden'}>
        <div className='label'>{getLocalizedString('common.public_message')}</div>
        <div className='message'>{publ.text}</div>
      </div>

      <div className='info'>
        {general.backstageUrl && <QRCode value={general.backstageUrl} size={qrSize} level='L' className='qr' />}
        {general.backstageInfo && <div className='info__message'>{general.backstageInfo}</div>}
      </div>
    </div>
  );
}
