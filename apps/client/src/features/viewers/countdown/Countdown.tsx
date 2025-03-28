import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  OntimeEntry,
  OntimeEvent,
  Playback,
  ProjectData,
  Runtime,
  Settings,
  SupportedEvent,
  TimerPhase,
} from 'ontime-types';

import ViewLogo from '../../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { formatTime, getDefaultFormat } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getFormattedTimer, isStringBoolean } from '../common/viewUtils';

import { fetchTimerData, getTimerItems, TimerMessage } from './countdown.helpers';
import { getCountdownOptions } from './countdown.options';
import CountdownSelect from './CountdownSelect';

import './Countdown.scss';

interface CountdownProps {
  backstageEvents: OntimeEvent[];
  general: ProjectData;
  isMirrored: boolean;
  runtime: Runtime;
  selectedId: string | null;
  settings: Settings | undefined;
  time: ViewExtendedTimer;
}

export default function Countdown(props: CountdownProps) {
  const { backstageEvents, general, isMirrored, runtime, selectedId, settings, time } = props;
  const [searchParams] = useSearchParams();
  const { getLocalizedString } = useTranslation();

  const [follow, setFollow] = useState<OntimeEvent | null>(null);
  const [delay, setDelay] = useState(0);

  useWindowTitle('Countdown');

  // eg. http://localhost:4001/countdown?eventId=ei0us
  // update data to the event we are following
  useEffect(() => {
    if (!backstageEvents) {
      return;
    }

    const eventId = searchParams.get('eventid');
    const eventIndex = searchParams.get('event');

    // if there is no event selected, we reset the data
    if (!eventId && !eventIndex) {
      setFollow(null);
      return;
    }

    let followThis: OntimeEvent | null = null;
    const events: OntimeEvent[] = [...backstageEvents].filter((event) => event.type === SupportedEvent.Event);

    if (eventId !== null) {
      followThis = events.find((event) => event.id === eventId) || null;
    } else if (eventIndex !== null) {
      followThis = events?.[Number(eventIndex) - 1];
    }
    if (followThis !== null) {
      setFollow(followThis);
      const idx: number = backstageEvents.findIndex((event: OntimeEntry) => event.id === followThis?.id);
      const delayToEvent = backstageEvents[idx]?.delay ?? 0;
      setDelay(delayToEvent);
    }
  }, [backstageEvents, searchParams]);

  const { message: runningMessage, timer: runningTimer } = fetchTimerData(time, follow, selectedId, runtime.offset);

  const standby = time.playback !== Playback.Play && time.playback !== Playback.Roll && selectedId === follow?.id;
  const finished = time.phase === TimerPhase.Overtime;
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

  const persistParam = () => {
    const eventId = searchParams.get('eventid');
    if (eventId !== null) {
      return { id: 'eventid', value: eventId };
    }
    const eventIndex = searchParams.get('event');
    if (eventIndex !== null) {
      return { id: 'eventindex', value: eventIndex };
    }
    return undefined;
  };

  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const viewOptions = getCountdownOptions(defaultFormat, persistParam());

  return (
    <div className={`countdown ${isMirrored ? 'mirror' : ''}`} data-testid='countdown-view'>
      {general?.projectLogo && <ViewLogo name={general.projectLogo} className='logo' />}
      <ViewParamsEditor viewOptions={viewOptions} />
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
