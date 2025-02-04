import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { AnimatePresence, motion } from 'framer-motion';
import { CustomFields, isOntimeEvent, OntimeEvent, ProjectData, Settings } from 'ontime-types';
import { millisToString, removeLeadingZero } from 'ontime-utils';

import ProgressBar from '../../common/components/progress-bar/ProgressBar';
import Schedule from '../../common/components/schedule/Schedule';
import { ScheduleProvider } from '../../common/components/schedule/ScheduleContext';
import ScheduleNav from '../../common/components/schedule/ScheduleNav';
import TitleCard from '../../common/components/title-card/TitleCard';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { timerPlaceholderMin } from '../../common/utils/styleUtils';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';
import { getPropertyValue } from '../../features/viewers/common/viewUtils';
import { useTranslation } from '../../translation/TranslationProvider';
import { titleVariants } from '../timer/timer.animations';

import { getBackstageOptions, useBackstageOptions } from './backstage.options';
import { getShowProgressBar, isOvertime } from './backstage.utils';

import './Backstage.scss';

export const MotionTitleCard = motion(TitleCard);

interface BackstageProps {
  backstageEvents: OntimeEvent[];
  customFields: CustomFields;
  eventNext: OntimeEvent | null;
  eventNow: OntimeEvent | null;
  general: ProjectData;
  isMirrored: boolean;
  time: ViewExtendedTimer;
  selectedId: string | null;
  settings: Settings | undefined;
}

export default function Backstage(props: BackstageProps) {
  const { backstageEvents, customFields, eventNext, eventNow, general, time, isMirrored, selectedId, settings } = props;

  const { getLocalizedString } = useTranslation();
  const { secondarySource } = useBackstageOptions();
  const [blinkClass, setBlinkClass] = useState(false);

  useWindowTitle('Backstage');

  // blink on change
  useEffect(() => {
    setBlinkClass(false);

    const timer = setTimeout(() => {
      setBlinkClass(true);
    }, 10);

    return () => clearTimeout(timer);
  }, [selectedId]);

  // gather auxiliar view data
  const filteredEvents = backstageEvents.filter(isOntimeEvent);
  const secondaryTextNext = getPropertyValue(eventNext, secondarySource);
  const secondaryTextNow = getPropertyValue(eventNow, secondarySource);

  // gather timer data
  const clock = formatTime(time.clock);
  const startedAt = formatTime(time.startedAt);
  const isNegative = isOvertime(time.current);

  let stageTimer = millisToString(time.current, { fallback: timerPlaceholderMin });
  stageTimer = removeLeadingZero(stageTimer);

  // gather presentation styles
  const expectedFinish = isNegative ? getLocalizedString('countdown.overtime') : formatTime(time.expectedFinish);
  const qrSize = Math.max(window.innerWidth / 15, 128);
  const showProgress = getShowProgressBar(time.playback);

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const backstageOptions = getBackstageOptions(defaultFormat, customFields);

  return (
    <div className={`backstage ${isMirrored ? 'mirror' : ''}`} data-testid='backstage-view'>
      <ViewParamsEditor viewOptions={backstageOptions} />
      <div className='project-header'>
        {general?.projectLogo && <ViewLogo name={general.projectLogo} className='logo' />}
        <div className='title'>{general.title}</div>
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
