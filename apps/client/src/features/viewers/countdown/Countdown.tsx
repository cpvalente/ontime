import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OntimeEvent, OntimeRundownEntry, Playback, Settings, SupportedEvent, ViewSettings } from 'ontime-types';
import { millisToString, removeLeadingZero } from 'ontime-utils';

import { overrideStylesURL } from '../../../common/api/constants';
import { getCountdownOptions } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { formatTime, getDefaultFormat } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';

import { fetchTimerData, TimerMessage } from './countdown.helpers';
import CountdownSelect from './CountdownSelect';

import './Countdown.scss';

interface CountdownProps {
  isMirrored: boolean;
  backstageEvents: OntimeEvent[];
  time: ViewExtendedTimer;
  selectedId: string | null;
  viewSettings: ViewSettings;
  settings: Settings | undefined;
}

export default function Countdown(props: CountdownProps) {
  const { isMirrored, backstageEvents, time, selectedId, viewSettings, settings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [searchParams] = useSearchParams();
  const { getLocalizedString } = useTranslation();

  const [follow, setFollow] = useState<OntimeEvent | null>(null);
  const [runningTimer, setRunningTimer] = useState(0);
  const [runningMessage, setRunningMessage] = useState<TimerMessage>(TimerMessage.unhandled);
  const [delay, setDelay] = useState(0);

  useWindowTitle('Countdown');

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
      const delayToEvent = backstageEvents[idx]?.delay ?? 0;
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

  const clock = formatTime(time.clock);
  const startTime = follow === null ? '...' : formatTime(follow.timeStart + delay);
  const endTime = follow === null ? '...' : formatTime(follow.timeEnd + delay);

  const formatTimer = (): string => {
    if (runningMessage === TimerMessage.ended) {
      return formatTime(runningTimer, { format12: 'hh:mm a', format24: 'HH:mm' });
    }
    let formattedTime = millisToString(isSelected ? runningTimer : runningTimer + delay);
    if (isSelected || runningMessage === TimerMessage.waiting) {
      formattedTime = removeLeadingZero(formattedTime);
    }
    return formattedTime;
  };
  const formattedTimer = formatTimer();

  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const timeOption = getCountdownOptions(defaultFormat);

  return (
    <div className={`countdown ${isMirrored ? 'mirror' : ''}`} data-testid='countdown-view'>
      <ViewParamsEditor paramFields={timeOption} />
      {follow === null ? (
        <CountdownSelect events={backstageEvents} />
      ) : (
        <div className='countdown-container' data-testid='countdown-event'>
          <div className='clock-container'>
            <div className='label'>{getLocalizedString('common.time_now')}</div>
            <SuperscriptTime time={clock} className='time' />
          </div>

          {runningMessage !== TimerMessage.unhandled && (
            <div className='status'>{getLocalizedString(`countdown.${runningMessage}`)}</div>
          )}

          <SuperscriptTime
            time={formattedTimer}
            className={`timer ${standby ? 'timer--paused' : ''} ${isRunningFinished ? 'timer--finished' : ''}`}
          />
          {follow?.title && <div className='title'>{follow.title}</div>}

          <div className='timer-group'>
            <div className='aux-timers'>
              <div className='aux-timers__label'>{getLocalizedString('common.start_time')}</div>
              <SuperscriptTime time={startTime} className={`aux-timers__value ${delayedTimerStyles}`} />
            </div>
            <div className='aux-timers'>
              <div className='aux-timers__label'>{getLocalizedString('common.end_time')}</div>
              <SuperscriptTime time={endTime} className={`aux-timers__value ${delayedTimerStyles}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
