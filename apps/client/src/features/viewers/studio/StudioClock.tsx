import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { OntimeEvent, OntimeRundown, Settings, ViewSettings } from 'ontime-types';
import { isOntimeEvent, Playback } from 'ontime-types';
import { formatDisplay } from 'ontime-utils';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import { getStudioClockOptions } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import useFitText from '../../../common/hooks/useFitText';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { TimeManagerType } from '../../../common/models/TimeManager.type';
import { secondsInMillis } from '../../../common/utils/dateConfig';
import { formatTime } from '../../../common/utils/time';

import { trimRundown } from './studioClock.utils';

import './StudioClock.scss';

const formatOptions = {
  showSeconds: false,
  format: 'hh:mm',
};

interface StudioClockProps {
  isMirrored: boolean;
  eventNext: OntimeEvent | null;
  time: TimeManagerType;
  backstageEvents: OntimeRundown;
  selectedId: string | null;
  nextId: string | null;
  onAir: boolean;
  viewSettings: ViewSettings;
  settings: Settings | undefined;
}

export default function StudioClock(props: StudioClockProps) {
  const { isMirrored, eventNext, time, backstageEvents, selectedId, nextId, onAir, viewSettings, settings } = props;

  // deferring rendering seems to affect styling (font and useFitText)
  useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const { fontSize: titleFontSize, ref: titleRef } = useFitText({ maxFontSize: 500 });

  const activeIndicators = [...Array(12).keys()];
  const secondsIndicators = [...Array(60).keys()];

  // TODO: fit titles on screen
  const MAX_TITLES = 11;

  const [searchParams] = useSearchParams();
  const showSeconds = searchParams.get('seconds');
  formatOptions.showSeconds = Boolean(showSeconds);
  formatOptions.format = `hh:mm${formatOptions.showSeconds ? ':ss' : ''}`;

  useEffect(() => {
    document.title = 'ontime - Studio Clock';
  }, []);

  const clock = formatTime(time.clock, formatOptions);
  const secondsNow = secondsInMillis(time.clock);
  const isNegative = (time.current ?? 0) < 0;
  const isPaused = time.playback === Playback.Pause;

  const studioClockOptions = getStudioClockOptions(settings?.timeFormat ?? '24');

  const delayed = backstageEvents.filter((event) => isOntimeEvent(event)) as OntimeEvent[];
  const trimmedRundown = trimRundown(delayed, selectedId, MAX_TITLES);

  return (
    <div className={`studio-clock ${isMirrored ? 'mirror' : ''}`} data-testid='studio-view'>
      <NavigationMenu />
      <ViewParamsEditor paramFields={studioClockOptions} />
      <div className='clock-container'>
        <div className='studio-timer-warp'>
          <div className={`studio-timer ${showSeconds ? 'studio-timer--with-seconds' : ''}`}>{clock}</div>
        </div>
        <div
          ref={titleRef}
          className='next-title'
          style={{ fontSize: titleFontSize, height: '10vh', width: '100%', maxWidth: '75%' }}
        >
          {eventNext?.title ?? '---'}
        </div>
        <div
          className={`
            next-countdown ${isNegative ? ' next-countdown--overtime' : ''} ${isPaused ? ' next-countdown--paused' : ''}
          `}
        >
          {isNegative ? '-' : '!'}
          {formatDisplay(time.current)}
        </div>
        <div className='clock-indicators'>
          {activeIndicators.map((i) => (
            <div
              key={i}
              className='hours hours--active'
              style={{
                transform: `rotate(${(360 / 12) * i - 90}deg) translateX(40vh)`,
              }}
            />
          ))}
          {secondsIndicators.map((i) => (
            <div
              key={i}
              className={i <= secondsNow ? 'min min--active' : 'min'}
              style={{
                transform: `rotate(${(360 / 60) * i - 90}deg) translateX(43vh)`,
              }}
            />
          ))}
        </div>
      </div>
      <div className='schedule-container'>
        <div
          className={onAir ? 'onAir' : 'onAir onAir--idle'}
          data-testid={onAir ? 'on-air-enabled' : 'on-air-disabled'}
        >
          ON AIR
        </div>
        <ul className='schedule'>
          {trimmedRundown.map((event) => {
            const start = formatTime(event.timeStart + (event?.delay ?? 0));
            const isSelected = event.id === selectedId;
            const isNext = event.id === nextId;
            const classes = `schedule__item schedule__item${isSelected ? '--now' : isNext ? '--next' : '--future'}`;
            return (
              <li key={event.id} className={classes}>
                <span className='user-colour' style={{ backgroundColor: `${event.colour}` }} />
                <span>{start}</span>
                <span>{event.title}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
