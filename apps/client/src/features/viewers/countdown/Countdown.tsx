import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OntimeEvent, OntimeRundownEntry, Playback, SupportedEvent, ViewSettings } from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { TimeManagerType } from '../../../common/models/TimeManager.type';
import { formatDisplay } from '../../../common/utils/dateConfig';
import getDelayTo from '../../../common/utils/getDelayTo';
import { formatTime } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';

import { fetchTimerData, TimerMessage } from './countdown.helpers';
import CountdownSelect from './CountdownSelect';

import './Countdown.scss';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

const formatOptionsFinished = {
  showSeconds: false,
  format: 'hh:mm a',
};

interface CountdownProps {
  isMirrored: boolean;
  backstageEvents: OntimeEvent[];
  time: TimeManagerType;
  selectedId: string | null;
  viewSettings: ViewSettings;
}

export default function Countdown(props: CountdownProps) {
  const { isMirrored, backstageEvents, time, selectedId, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [searchParams] = useSearchParams();
  const { getLocalizedString } = useTranslation();

  const [follow, setFollow] = useState<OntimeEvent | null>(null);
  const [runningTimer, setRunningTimer] = useState(0);
  const [runningMessage, setRunningMessage] = useState<TimerMessage>(TimerMessage.unhandled);
  const [delay, setDelay] = useState(0);

  useEffect(() => {
    document.title = 'ontime - Countdown';
  }, []);

  // eg. http://localhost:4001/countdown?eventId=ei0us
  // Check for user options
  useEffect(() => {
    if (!backstageEvents) {
      return;
    }

    const eventId = searchParams.get('eventid');
    const eventIndex = searchParams.get('event');

    let followThis: OntimeEvent | null = null;
    const events: OntimeEvent[] = [...backstageEvents].filter((event) => event.type === SupportedEvent.Event);

    if (eventId !== null) {
      followThis = events.find((event) => event.id === eventId) || null;
    } else if (eventIndex !== null) {
      followThis = events?.[Number(eventIndex) - 1];
    }
    if (followThis !== null) {
      setFollow(followThis);
      const idx: number = backstageEvents.findIndex((event: OntimeRundownEntry) => event.id === followThis?.id);
      const delayToEvent = getDelayTo(backstageEvents, idx);
      setDelay(delayToEvent);
    }
  }, [backstageEvents, searchParams]);

  useEffect(() => {
    if (!follow) {
      return;
    }

    const { message, timer } = fetchTimerData(time, follow, selectedId);
    setRunningMessage(message);
    setRunningTimer(timer);
  }, [follow, selectedId, time]);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  const standby = time.playback !== Playback.Play && time.playback !== Playback.Roll && selectedId === follow?.id;
  const finished = time.playback === Playback.Play && (time.current ?? 0) < 0 && time.startedAt;
  const isRunningFinished = finished && runningMessage === TimerMessage.running;
  const isSelected = runningMessage === TimerMessage.running;
  const delayedTimerStyles = delay > 0 ? 'aux-timers__value--delayed' : '';

  const clock = formatTime(time.clock, formatOptions);
  const startTime = follow === null ? '...' : formatTime(follow.timeStart + delay, formatOptions);
  const endTime = follow === null ? '...' : formatTime(follow.timeEnd + delay, formatOptions);
  const formattedTimer =
    runningMessage === TimerMessage.ended
      ? formatTime(runningTimer, formatOptionsFinished)
      : formatDisplay(
          isSelected ? runningTimer : runningTimer + delay,
          isSelected || runningMessage === TimerMessage.waiting,
        );

  return (
    <div className={`countdown ${isMirrored ? 'mirror' : ''}`} data-testid='countdown-view'>
      <NavigationMenu />
      {follow === null ? (
        <CountdownSelect events={backstageEvents} />
      ) : (
        <div className='countdown-container' data-testid='countdown-event'>
          <div className='clock-container'>
            <div className='label'>{getLocalizedString('common.time_now')}</div>
            <div className='time'>{clock}</div>
          </div>

          <div className='status'>{getLocalizedString(`countdown.${runningMessage}`)}</div>

          <span className={`timer ${standby ? 'timer--paused' : ''} ${isRunningFinished ? 'timer--finished' : ''}`}>
            {formattedTimer}
          </span>
          <div className='title'>{follow?.title || 'Untitled Event'}</div>

          <div className='timer-group'>
            <div className='aux-timers'>
              <div className='aux-timers__label'>{getLocalizedString('common.start_time')}</div>
              <span className={`aux-timers__value ${delayedTimerStyles}`}>{startTime}</span>
            </div>
            <div className='aux-timers'>
              <div className='aux-timers__label'>{getLocalizedString('common.end_time')}</div>
              <span className={`aux-timers__value ${delayedTimerStyles}`}>{endTime}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
