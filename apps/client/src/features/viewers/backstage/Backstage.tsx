import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CustomFields, Message, OntimeEvent, ProjectData, Settings, SupportedEvent, ViewSettings } from 'ontime-types';
import { millisToString, removeLeadingZero } from 'ontime-utils';

import { overrideStylesURL } from '../../../common/api/constants';
import { ConnectedIndicator } from '../../../common/components/connected-indicator/ConnectedIndicator';
import ProgressBar from '../../../common/components/progress-bar/ProgressBar';
import Schedule from '../../../common/components/schedule/Schedule';
import { ScheduleProvider } from '../../../common/components/schedule/ScheduleContext';
import ScheduleNav from '../../../common/components/schedule/ScheduleNav';
import TitleCard from '../../../common/components/title-card/TitleCard';
import { getBackstageOptions } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { formatTime, getDefaultFormat } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';
import { titleVariants } from '../common/animation';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getPropertyValue } from '../common/viewUtils';

import './Backstage.scss';

interface BackstageProps {
  customFields: CustomFields;
  isMirrored: boolean;
  publ: Message;
  eventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  time: ViewExtendedTimer;
  backstageEvents: OntimeEvent[];
  selectedId: string | null;
  general: ProjectData;
  viewSettings: ViewSettings;
  settings: Settings | undefined;
}

export default function Backstage(props: BackstageProps) {
  const {
    customFields,
    isMirrored,
    publ,
    eventNow,
    eventNext,
    time,
    backstageEvents,
    selectedId,
    general,
    viewSettings,
    settings,
  } = props;

  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const { getLocalizedString } = useTranslation();
  const [blinkClass, setBlinkClass] = useState(false);
  const [searchParams] = useSearchParams();

  useWindowTitle('Backstage');

  // blink on change
  useEffect(() => {
    setBlinkClass(false);

    const timer = setTimeout(() => {
      setBlinkClass(true);
    }, 10);

    return () => clearTimeout(timer);
  }, [selectedId]);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  const clock = formatTime(time.clock);
  const startedAt = formatTime(time.startedAt);
  const isNegative = (time.current ?? 0) < 0;
  const expectedFinish = isNegative ? getLocalizedString('countdown.overtime') : formatTime(time.expectedFinish);

  const qrSize = Math.max(window.innerWidth / 15, 128);
  const filteredEvents = backstageEvents.filter((event) => event.type === SupportedEvent.Event);
  const showPublicMessage = publ.text && publ.visible;
  const showProgress = time.playback !== 'stop';

  const secondarySource = searchParams.get('secondary-src');
  const secondaryTextNext = getPropertyValue(eventNext, secondarySource);
  const secondaryTextNow = getPropertyValue(eventNow, secondarySource);

  let stageTimer = millisToString(time.current, { fallback: '- - : - -' });
  stageTimer = removeLeadingZero(stageTimer);

  const totalTime = (time.duration ?? 0) + (time.addedTime ?? 0);
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const backstageOptions = getBackstageOptions(defaultFormat, customFields);

  return (
    <div className={`backstage ${isMirrored ? 'mirror' : ''}`} data-testid='backstage-view'>
      <ConnectedIndicator style={{ position: 'absolute', left: '1em', top: '0.5em' }} />

      <ViewParamsEditor paramFields={backstageOptions} />
      <div className='project-header'>
        {general.title}
        <div className='clock-container'>
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <SuperscriptTime time={clock} className='time' />
        </div>
      </div>

      <ProgressBar
        className='progress-container'
        now={time.current ?? undefined}
        complete={totalTime}
        hidden={!showProgress}
      />

      <div className='now-container'>
        <AnimatePresence>
          {eventNow && (
            <motion.div
              className={`event now ${blinkClass ? 'blink' : ''}`}
              key='now'
              variants={titleVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
            >
              <TitleCard label='now' title={eventNow.title} secondary={secondaryTextNow} />
              <div className='timer-group'>
                <div className='aux-timers'>
                  <div className='aux-timers__label'>{getLocalizedString('common.started_at')}</div>
                  <SuperscriptTime time={startedAt} className='aux-timers__value' />
                </div>
                <div className='timer-gap' />
                <div className='aux-timers'>
                  <div className='aux-timers__label'>{getLocalizedString('common.expected_finish')}</div>
                  {isNegative ? (
                    <div className='aux-timers__value'>{expectedFinish}</div>
                  ) : (
                    <SuperscriptTime time={expectedFinish} className='aux-timers__value' />
                  )}
                </div>
                <div className='timer-gap' />
                <div className='aux-timers'>
                  <div className='aux-timers__label'>{getLocalizedString('common.stage_timer')}</div>
                  <div className='aux-timers__value'>{stageTimer}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {eventNext && (
            <motion.div
              className='event next'
              key='next'
              variants={titleVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
            >
              <TitleCard label='next' title={eventNext.title} secondary={secondaryTextNext} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScheduleProvider events={filteredEvents} selectedEventId={selectedId} isBackstage>
        <ScheduleNav className='schedule-nav-container' />
        <Schedule isProduction className='schedule-container' />
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
