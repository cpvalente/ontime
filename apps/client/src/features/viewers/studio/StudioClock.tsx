import { useSearchParams } from 'react-router-dom';
import type { MaybeString, OntimeEntry, OntimeEvent, ProjectData, Settings } from 'ontime-types';
import { Playback } from 'ontime-types';
import { millisToString, removeSeconds, secondsInMillis } from 'ontime-utils';

import { FitText } from '../../../common/components/fit-text/FitText';
import ViewLogo from '../../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { formatTime, getDefaultFormat } from '../../../common/utils/time';
import { isStringBoolean } from '../common/viewUtils';

import { getStudioClockOptions } from './studioClock.options';
import StudioClockSchedule from './StudioClockSchedule';

import './StudioClock.scss';

interface StudioClockProps {
  backstageEvents: OntimeEntry[];
  eventNext: OntimeEvent | null;
  general: ProjectData;
  isMirrored: boolean;
  time: ViewExtendedTimer;
  selectedId: MaybeString;
  nextId: MaybeString;
  onAir: boolean;
  settings: Settings | undefined;
}

export default function StudioClock(props: StudioClockProps) {
  const { backstageEvents, eventNext, general, isMirrored, time, selectedId, nextId, onAir, settings } = props;

  const [searchParams] = useSearchParams();

  useWindowTitle('Studio Clock');

  const activeIndicators = [...Array(12).keys()];
  const secondsIndicators = [...Array(60).keys()];

  let clock = formatTime(time.clock);
  let hasAmPm = '';
  if (clock.includes('AM')) {
    clock = clock.replace('PM', '');
    hasAmPm = 'AM';
  } else if (clock.includes('PM')) {
    clock = clock.replace('PM', '');
    hasAmPm = 'PM';
  }

  const secondsNow = secondsInMillis(time.clock);
  const isNegative = (time.current ?? 0) < 0;
  const isPaused = time.playback === Playback.Pause;

  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const studioClockOptions = getStudioClockOptions(defaultFormat);

  const hideRight = isStringBoolean(searchParams.get('hideRight'));
  let timer = millisToString(time.current, { fallback: '---' });
  const hideSeconds = isStringBoolean(searchParams.get('hideTimerSeconds'));
  if (time.current != null && hideSeconds) {
    timer = removeSeconds(timer);
  }

  return (
    <div
      className={`studio-clock ${isMirrored ? 'mirror' : ''} ${hideRight ? 'hide-right' : ''}`}
      data-testid='studio-view'
    >
      {general?.projectLogo && <ViewLogo name={general.projectLogo} className='logo' />}
      <ViewParamsEditor viewOptions={studioClockOptions} />
      <div className='clock-container'>
        {hasAmPm && <div className='clock__ampm'>{hasAmPm}</div>}
        <div className={`studio-timer ${!hideSeconds ? 'studio-timer--with-seconds' : ''}`}>{clock}</div>
        <FitText className='next-title'>{eventNext?.title}</FitText>
        <div
          className={`
            next-countdown ${isNegative ? ' next-countdown--overtime' : ''} ${isPaused ? ' next-countdown--paused' : ''}
          `}
        >
          {timer}
        </div>
        <div className='clock-indicators'>
          {activeIndicators.map((i) => (
            <div
              key={i}
              className='hours hours--active'
              style={{
                transform: `rotate(${(360 / 12) * i - 90}deg) translateX(var(--smaller-half-size))`,
              }}
            />
          ))}
          {secondsIndicators.map((i) => (
            <div
              key={i}
              className={i <= secondsNow ? 'min min--active' : 'min'}
              style={{
                transform: `rotate(${(360 / 60) * i - 90}deg) translateX(var(--half-size))`,
              }}
            />
          ))}
        </div>
      </div>
      {!hideRight && (
        <StudioClockSchedule rundown={backstageEvents} selectedId={selectedId} nextId={nextId} onAir={onAir} />
      )}
    </div>
  );
}
