import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CustomFields, OntimeEvent, ProjectData, Settings, SupportedEvent } from 'ontime-types';
import { millisToString, removeLeadingZero } from 'ontime-utils';

import ProgressBar from '../../../common/components/progress-bar/ProgressBar';
import Schedule from '../../../common/components/schedule/Schedule';
import { ScheduleProvider } from '../../../common/components/schedule/ScheduleContext';
import ScheduleNav from '../../../common/components/schedule/ScheduleNav';
import TitleCard from '../../../common/components/title-card/TitleCard';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { timerPlaceholderMin } from '../../../common/utils/styleUtils';
import { formatTime, getDefaultFormat } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';
import { titleVariants } from '../common/animation';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getPropertyValue } from '../common/viewUtils';

import { getBackstageOptions } from './backstage.options';

import './Backstage.scss';

export const MotionTitleCard = motion(TitleCard);

interface BackstageProps {
  customFields: CustomFields;
  isMirrored: boolean;
  eventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  time: ViewExtendedTimer;
  backstageEvents: OntimeEvent[];
  selectedId: string | null;
  general: ProjectData;
  settings: Settings | undefined;
}

export default function Backstage(props: BackstageProps) {
  const { customFields, isMirrored, eventNow, eventNext, time, backstageEvents, selectedId, general, settings } = props;

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

  const clock = formatTime(time.clock);
  const startedAt = formatTime(time.startedAt);
  const isNegative = (time.current ?? 0) < 0;
  const expectedFinish = isNegative ? getLocalizedString('countdown.overtime') : formatTime(time.expectedFinish);

  const qrSize = Math.max(window.innerWidth / 15, 128);
  const filteredEvents = backstageEvents.filter((event) => event.type === SupportedEvent.Event);
  const showProgress = time.playback !== 'stop';

  const secondarySource = searchParams.get('secondary-src');
  const secondaryTextNext = getPropertyValue(eventNext, secondarySource);
  const secondaryTextNow = getPropertyValue(eventNow, secondarySource);

  let stageTimer = millisToString(time.current, { fallback: timerPlaceholderMin });
  stageTimer = removeLeadingZero(stageTimer);

  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const backstageOptions = getBackstageOptions(defaultFormat, customFields);

  return (
    <div className={`backstage ${isMirrored ? 'mirror' : ''}`} data-testid='backstage-view'>
      <ViewParamsEditor viewOptions={backstageOptions} />
      <div className='project-header'>
        {general.title}
        <div className='clock-container'>
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <SuperscriptTime time={clock} className='time' />
        </div>
      </div>

      <ProgressBar
        className='progress-container'
        current={time.current}
        duration={time.duration}
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
              <TitleCard title={eventNow.title} secondary={secondaryTextNow} />
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
            <MotionTitleCard
              className='event next'
              key='next'
              variants={titleVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              label='next'
              title={eventNext.title}
              secondary={secondaryTextNext}
            />
          )}
        </AnimatePresence>
      </div>

      <ScheduleProvider events={filteredEvents} selectedEventId={selectedId} isBackstage>
        <ScheduleNav className='schedule-nav-container' />
        <Schedule isProduction className='schedule-container' />
      </ScheduleProvider>

      <div className='info'>
        {general.backstageUrl && <QRCode value={general.backstageUrl} size={qrSize} level='L' className='qr' />}
        {general.backstageInfo && <div className='info__message'>{general.backstageInfo}</div>}
      </div>
    </div>
  );
}
