import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { OntimeEvent, OntimeRundown, Settings, ViewSettings } from 'ontime-types';
import { SupportedEvent } from 'ontime-types';
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

import { type ScheduleEvent, formatEventList, trimRundown } from './studioClock.utils';

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

  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);

  const activeIndicators = [...Array(12).keys()];
  const secondsIndicators = [...Array(60).keys()];
  const MAX_TITLES = 12;

  const [searchParams] = useSearchParams();
  const showSeconds = searchParams.get('seconds');
  formatOptions.showSeconds = Boolean(showSeconds);
  formatOptions.format = `hh:mm${formatOptions.showSeconds ? ':ss' : ''}`;

  useEffect(() => {
    document.title = 'ontime - Studio Clock';
  }, []);

  // Prepare event list
  useEffect(() => {
    if (!backstageEvents) {
      return;
    }

    const delayed = backstageEvents.filter((event) => event.type === SupportedEvent.Event);
    const trimmed = trimRundown(delayed as OntimeEvent[], selectedId || '', MAX_TITLES);

    const formatted = formatEventList(trimmed, selectedId || '', nextId || '', {
      showEnd: false,
    });
    setSchedule(formatted);
  }, [backstageEvents, nextId, selectedId]);

  const clock = formatTime(time.clock, formatOptions);
  const secondsNow = secondsInMillis(time.clock);
  const isNegative = (time.current ?? 0) < 0;

  const studioClockOptions = getStudioClockOptions(settings?.timeFormat ?? '24');

  return (
    <div className={`studio-clock ${isMirrored ? 'mirror' : ''}`} data-testid='studio-view'>
      <NavigationMenu />
      <ViewParamsEditor paramFields={studioClockOptions} />
      <div className='clock-container'>
        <div className={`studio-timer ${showSeconds ? 'studio-timer--with-seconds' : ''}`}>{clock}</div>
        <div
          ref={titleRef}
          className='next-title'
          style={{ fontSize: titleFontSize, height: '10vh', width: '100%', maxWidth: '75%' }}
        >
          {eventNext?.title ?? ''}
        </div>
        <div className={isNegative ? 'next-countdown' : 'next-countdown next-countdown--overtime'}>
          {selectedId !== null && formatDisplay(time.current)}
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
        <div className='schedule'>
          <ul>
            {schedule.map((s) => (
              <li key={s.id} className={s.isNow ? 'now' : s.isNext ? 'next' : ''}>
                <div className='user-colour' style={{ backgroundColor: `${s.colour !== '' ? s.colour : ''}` }} />
                {`${s.time} ${s.title}`}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
