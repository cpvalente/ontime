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
import BackstageSchedule from '../common/schedule/BackstageSchedule';

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
  const scheduledStart = showNow ? '' : formatTime(runtime.plannedStart, { format12: 'hh:mm a', format24: 'HH:mm' });
  const scheduledEnd = showNow ? '' : formatTime(runtime.plannedEnd, { format12: 'hh:mm a', format24: 'HH:mm' });

  let stageTimer = millisToString(time.current, { fallback: timerPlaceholderMin });
  stageTimer = removeLeadingZero(stageTimer);

  // gather presentation styles
  const qrSize = Math.max(window.innerWidth / 15, 72);
  const showProgress = getShowProgressBar(time.playback);
  const showSchedule = screenHeight > 700; // in vertical screens we may not have space

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

      <ProgressBar
        className='progress-container'
        current={time.current}
        duration={time.duration}
        hidden={!showProgress}
      />

      {backstageEvents.length === 0 && (
        <div className='empty-container'>
          <Empty text={getLocalizedString('common.no_data')} />
        </div>
      )}

      <div className='card-container'>
        {showNow ? (
          <div className={cx(['event', 'now', blinkClass && 'blink'])}>
            <TitleCard title={nowMain} secondary={nowSecondary} />
            <div className='timer-group'>
              <div className='aux-timers'>
                <div className={cx(['aux-timers__label', isPendingStart && 'aux-timers--pending'])}>
                  {isPendingStart ? getLocalizedString('countdown.waiting') : getLocalizedString('common.started_at')}
                </div>
                <SuperscriptTime time={startedAt} className='aux-timers__value' />
              </div>
              <div className='timer-gap' />
              <div className='aux-timers'>
                <div className='aux-timers__label'>{getLocalizedString('common.expected_finish')}</div>
                {isOvertime(time.current) ? (
                  <div className='aux-timers__value'>{getLocalizedString('countdown.overtime')}</div>
                ) : (
                  <SuperscriptTime time={formatTime(time.expectedFinish)} className='aux-timers__value' />
                )}
              </div>
              <div className='timer-gap' />
              <div className='aux-timers'>
                <div className='aux-timers__label'>{getLocalizedString('common.stage_timer')}</div>
                <div className='aux-timers__value'>{stageTimer}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className='event'>
            <div className='title-card__placeholder'>{getLocalizedString('countdown.waiting')}</div>
            <div className='timer-group'>
              <div className='aux-timers'>
                <div className={cx(['aux-timers__label', isPendingStart && 'aux-timers--pending'])}>
                  {getLocalizedString('common.scheduled_start')}
                </div>
                <SuperscriptTime time={scheduledStart} className='aux-timers__value' />
              </div>
              <div className='timer-gap' />
              <div className='aux-timers'>
                <div className='aux-timers__label'>{getLocalizedString('common.scheduled_end')}</div>
                <SuperscriptTime time={scheduledEnd} className='aux-timers__value' />
              </div>
            </div>
          </div>
        )}

        {showNext && <TitleCard className='event' label='next' title={nextMain} secondary={nextSecondary} />}
      </div>

      {showSchedule && <BackstageSchedule selectedId={selectedId} />}

      <div className='info'>
        {general.backstageUrl && <QRCode value={general.backstageUrl} size={qrSize} level='L' className='qr' />}
        {general.backstageInfo && <div className='info__message'>{general.backstageInfo}</div>}
      </div>
    </div>
  );
}
