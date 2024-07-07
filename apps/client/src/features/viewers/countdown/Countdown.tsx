import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  OntimeEvent,
  OntimeRundownEntry,
  Playback,
  Runtime,
  Settings,
  SupportedEvent,
  ViewSettings,
} from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/constants';
import { getCountdownOptions } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { formatTime, getDefaultFormat } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getFormattedTimer, isStringBoolean } from '../common/viewUtils';

import { fetchTimerData, getTimerItems, TimerMessage } from './countdown.helpers';
import CountdownSelect from './CountdownSelect';

import './Countdown.scss';

interface CountdownProps {
  isMirrored: boolean;
  backstageEvents: OntimeEvent[];
  runtime: Runtime;
  selectedId: string | null;
  settings: Settings | undefined;
  time: ViewExtendedTimer;
  viewSettings: ViewSettings;
}

export default function Countdown(props: CountdownProps) {
  const { isMirrored, backstageEvents, runtime, selectedId, settings, time, viewSettings } = props;
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

    const { message, timer } = fetchTimerData(time, follow, selectedId, runtime.offset);
    setRunningMessage(message);
    setRunningTimer(timer);
  }, [follow, selectedId, time, runtime.offset]);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  const standby = time.playback !== Playback.Play && time.playback !== Playback.Roll && selectedId === follow?.id;
  const finished = time.playback === Playback.Play && (time.current ?? 0) < 0 && time.startedAt;
  const isRunningFinished = finished && runningMessage === TimerMessage.running;
  const delayedTimerStyles = delay > 0 ? 'aux-timers__value--delayed' : '';

  const clock = formatTime(time.clock);
  const { scheduledStart, scheduledEnd, projectedStart, projectedEnd } = getTimerItems(
    follow?.timeStart,
    follow?.timeEnd,
    delay,
    runtime.offset,
  );

  const hideSeconds = searchParams.get('hideTimerSeconds');
  const formattedTimer = getFormattedTimer(runningTimer, time.timerType, getLocalizedString('common.minutes'), {
    removeSeconds: isStringBoolean(hideSeconds),
    removeLeadingZero: false,
  });

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
            {projectedStart && projectedEnd && (
              <div className='timer-group__projected-start'>
                <div className='timer-group__label'>{getLocalizedString('common.projected_start')}</div>
                <SuperscriptTime time={projectedStart} className={`timer-group__value ${delayedTimerStyles}`} />
              </div>
            )}
            {projectedStart && projectedEnd && (
              <div className='timer-group__projected-end'>
                <div className='timer-group__label'>{getLocalizedString('common.projected_end')}</div>
                <SuperscriptTime time={projectedEnd} className={`timer-group__value ${delayedTimerStyles}`} />
              </div>
            )}
            <div className='timer-group__scheduled-start'>
              <div className='timer-group__label'>{getLocalizedString('common.scheduled_start')}</div>
              <SuperscriptTime time={scheduledStart} className={`timer-group__value ${delayedTimerStyles}`} />
            </div>
            <div className='timer-group__scheduled-end'>
              <div className='timer-group__label'>{getLocalizedString('common.scheduled_end')}</div>
              <SuperscriptTime time={scheduledEnd} className={`timer-group__value ${delayedTimerStyles}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
