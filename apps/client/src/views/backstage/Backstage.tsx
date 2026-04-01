import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { useViewportSize } from '@mantine/hooks';
import { CustomFields, OntimeEvent, ProjectData, Runtime, Settings } from 'ontime-types';
import { millisToString, removeLeadingZero } from 'ontime-utils';

import ProgressBar from '../../common/components/progress-bar/ProgressBar';
import Empty from '../../common/components/state/Empty';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { cx, timerPlaceholderMin } from '../../common/utils/styleUtils';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';
import { useTranslation } from '../../translation/TranslationProvider';
import ScheduleExport from '../common/schedule/ScheduleExport';

import { getBackstageOptions, useBackstageOptions } from './backstage.options';
import { getCardData, getFollowedByEvent, getIsPendingStart, getShowProgressBar, getTimeToMinutes, isOvertime } from './backstage.utils';

import './Backstage.scss';

interface BackstageProps {
  backstageEvents: OntimeEvent[];
  customFields: CustomFields;
  eventNext: OntimeEvent | null;
  eventNow: OntimeEvent | null;
  general: ProjectData;
  isMirrored: boolean;
  time: ViewExtendedTimer;
  runtime: Runtime;
  selectedId: string | null;
  settings: Settings | undefined;
}

export default function Backstage(props: BackstageProps) {
  const {
    backstageEvents,
    customFields,
    eventNext,
    eventNow,
    general,
    time,
    isMirrored,
    runtime,
    selectedId,
    settings,
  } = props;

  const { getLocalizedString } = useTranslation();
  const { secondarySource } = useBackstageOptions();
  const [blinkClass, setBlinkClass] = useState(false);
  const { height: screenHeight } = useViewportSize();

  useWindowTitle('Backstage');

  // blink on change
  useEffect(() => {
    setBlinkClass(false);

    const timer = setTimeout(() => {
      setBlinkClass(true);
    }, 10);

    return () => clearTimeout(timer);
  }, [selectedId]);

  // gather card data
  const hasEvents = backstageEvents.length > 0;
  const { showNow, nowMain, showNext, nextMain } = getCardData(
    eventNow,
    eventNext,
    'title',
    secondarySource,
    time.playback,
  );

  // find the event after next ("followed by")
  const eventFollowedBy = useMemo(
    () => getFollowedByEvent(backstageEvents, eventNext),
    [backstageEvents, eventNext],
  );

  // gather timer data
  const clock = formatTime(time.clock);
  const isPendingStart = getIsPendingStart(time.playback, time.phase);

  const scheduledStart = (() => {
    if (showNow) return undefined;
    if (!hasEvents) return undefined;
    return formatTime(runtime.plannedStart, { format12: 'hh:mm a', format24: 'HH:mm' });
  })();

  const scheduledEnd = (() => {
    if (showNow) return undefined;
    if (!hasEvents) return undefined;
    return formatTime(runtime.plannedEnd, { format12: 'hh:mm a', format24: 'HH:mm' });
  })();

  let displayTimer = millisToString(time.current, { fallback: timerPlaceholderMin });
  displayTimer = removeLeadingZero(displayTimer);
  // roll hours into minutes to show mm:ss only (eg. 1:15:00 → 75:00)
  const isNegative = displayTimer.startsWith('-');
  const absTimer = isNegative ? displayTimer.slice(1) : displayTimer;
  const timerParts = absTimer.split(':');
  if (timerParts.length === 3) {
    const hours = parseInt(timerParts[0], 10);
    const mins = parseInt(timerParts[1], 10) + hours * 60;
    displayTimer = `${isNegative ? '-' : ''}${mins}:${timerParts[2]}`;
  }
  const overtime = isOvertime(time.current);

  // compute time-to values for next and followed by
  const timeToNext = getTimeToMinutes(time.current);
  const timeToFollowedBy = getTimeToMinutes(time.current, eventNext?.duration);

  // gather presentation styles
  const qrSize = Math.max(window.innerWidth / 15, 72);
  const showProgress = getShowProgressBar(time.playback);
  const showSchedule = hasEvents && screenHeight > 420; // in vertical screens we may not have space
  const showPending = scheduledStart && scheduledEnd;

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const backstageOptions = getBackstageOptions(defaultFormat, customFields);

  const followedByMain = eventFollowedBy?.title;

  return (
    <div className={`backstage ${isMirrored ? 'mirror' : ''}`} data-testid='backstage-view'>
      <ViewParamsEditor viewOptions={backstageOptions} />
      <div className='project-header'>
        {general?.projectLogo ? <ViewLogo name={general.projectLogo} className='logo' /> : <div className='logo' />}
        <div className='title'>{general.title}</div>
        <div className='clock-container'>
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <SuperscriptTime time={clock} className='time' />
        </div>
      </div>

      {!hasEvents && <Empty text={getLocalizedString('common.no_data')} className='empty-container' />}

      <div className='card-container'>
        {showNow && (
          <div className={cx(['now-card', blinkClass && 'blink'])}>
            <span className='now-card__label'>{getLocalizedString('common.now')}</span>
            <span className='now-card__title'>{nowMain}</span>
            <div className={cx(['now-card__timer', overtime && 'now-card__timer--negative'])}>
              {displayTimer}
            </div>
            {showProgress && <ProgressBar className='now-card__progress' current={time.current} duration={time.duration} />}
          </div>
        )}

        {showPending && (
          <div className='pending-card'>
            <div className='pending-card__placeholder'>{getLocalizedString('countdown.waiting')}</div>
            <div className='pending-card__times'>
              <div className='pending-card__entry'>
                <span className={cx(['pending-card__label', isPendingStart && 'pending-card__label--pending'])}>
                  {getLocalizedString('common.scheduled_start')}
                </span>
                <SuperscriptTime time={scheduledStart} className='pending-card__value' />
              </div>
              <div className='pending-card__entry'>
                <span className='pending-card__label'>{getLocalizedString('common.scheduled_end')}</span>
                <SuperscriptTime time={scheduledEnd} className='pending-card__value' />
              </div>
            </div>
          </div>
        )}

        {showNext && hasEvents && (
          <div className='upcoming-card'>
            <span className='upcoming-card__label'>{getLocalizedString('common.next')}</span>
            <span className='upcoming-card__title'>{nextMain}</span>
          </div>
        )}

        {eventFollowedBy && showNow && (
          <div className='upcoming-card'>
            <span className='upcoming-card__label'>Then</span>
            <span className='upcoming-card__title'>{followedByMain}</span>
          </div>
        )}
      </div>

      {showSchedule && <ScheduleExport selectedId={selectedId} isBackstage />}

      <div className={cx(['info', !showSchedule && 'info--stretch'])}>
        {general.backstageUrl && <QRCode value={general.backstageUrl} size={qrSize} level='L' className='qr' />}
        {general.backstageInfo && <div className='info__message'>{general.backstageInfo}</div>}
      </div>
    </div>
  );
}
