import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useViewportSize } from '@mantine/hooks';
import { CustomFields, OntimeEvent, ProjectData, Runtime, Settings } from 'ontime-types';
import { millisToString, removeLeadingZero } from 'ontime-utils';

import ProgressBar from '../../common/components/progress-bar/ProgressBar';
import Empty from '../../common/components/state/Empty';
import TitleCard from '../../common/components/title-card/TitleCard';
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
import { getCardData, getIsPendingStart, getShowProgressBar, isOvertime } from './backstage.utils';

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
  const { showNow, nowMain, nowSecondary, showNext, nextMain, nextSecondary } = getCardData(
    eventNow,
    eventNext,
    'title',
    secondarySource,
    time.playback,
  );

  // gather timer data
  const clock = formatTime(time.clock);
  const isPendingStart = getIsPendingStart(time.playback, time.phase);
  const startedAt = isPendingStart ? formatTime(time.secondaryTimer) : formatTime(time.startedAt);
  const scheduledStart =
    hasEvents && showNow ? '' : formatTime(runtime.plannedStart, { format12: 'hh:mm a', format24: 'HH:mm' });
  const scheduledEnd =
    hasEvents && showNow ? '' : formatTime(runtime.plannedEnd, { format12: 'hh:mm a', format24: 'HH:mm' });

  let displayTimer = millisToString(time.current, { fallback: timerPlaceholderMin });
  displayTimer = removeLeadingZero(displayTimer);

  // gather presentation styles
  const qrSize = Math.max(window.innerWidth / 15, 72);
  const showProgress = getShowProgressBar(time.playback);
  const showSchedule = hasEvents && screenHeight > 420; // in vertical screens we may not have space

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const backstageOptions = getBackstageOptions(defaultFormat, customFields);

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

      {showProgress && <ProgressBar className='progress-container' current={time.current} duration={time.duration} />}

      {!hasEvents && <Empty text={getLocalizedString('common.no_data')} className='empty-container' />}

      <div className='card-container'>
        {showNow && (
          <div className={cx(['event', 'now', blinkClass && 'blink'])}>
            <TitleCard title={nowMain} secondary={nowSecondary} />
            <div className='timer-group'>
              <div className='time-entry'>
                <div className={cx(['time-entry__label', isPendingStart && 'time-entry--pending'])}>
                  {isPendingStart ? getLocalizedString('countdown.waiting') : getLocalizedString('common.started_at')}
                </div>
                <SuperscriptTime time={startedAt} className='time-entry__value' />
              </div>
              <div className='timer-gap' />
              <div className='time-entry'>
                <div className='time-entry__label'>{getLocalizedString('common.expected_finish')}</div>
                {isOvertime(time.current) ? (
                  <div className='time-entry__value'>{getLocalizedString('countdown.overtime')}</div>
                ) : (
                  <SuperscriptTime time={formatTime(time.expectedFinish)} className='time-entry__value' />
                )}
              </div>
              <div className='timer-gap' />
              <div className='time-entry'>
                <div className='time-entry__label'>{getLocalizedString('common.stage_timer')}</div>
                <div className='time-entry__value'>{displayTimer}</div>
              </div>
            </div>
          </div>
        )}

        {!showNow && hasEvents && (
          <div className='event'>
            <div className='title-card__placeholder'>{getLocalizedString('countdown.waiting')}</div>
            <div className='timer-group'>
              <div className='time-entry'>
                <div className={cx(['time-entry__label', isPendingStart && 'time-entry--pending'])}>
                  {getLocalizedString('common.scheduled_start')}
                </div>
                <SuperscriptTime time={scheduledStart} className='time-entry__value' />
              </div>
              <div className='timer-gap' />
              <div className='time-entry'>
                <div className='time-entry__label'>{getLocalizedString('common.scheduled_end')}</div>
                <SuperscriptTime time={scheduledEnd} className='time-entry__value' />
              </div>
            </div>
          </div>
        )}

        {showNext && hasEvents && (
          <TitleCard className='event' label='next' title={nextMain} secondary={nextSecondary} />
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
