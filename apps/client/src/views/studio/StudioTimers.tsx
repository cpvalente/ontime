import { MessageState, OntimeEvent, Playback, Runtime, TimerPhase, TimerState, ViewSettings } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { cx } from '../../common/utils/styleUtils';
import { useTranslation } from '../../translation/TranslationProvider';
import { getTimerColour } from '../utils/presentation.utils';

import { getFormattedEventData, getFormattedScheduleTimes } from './studioTimers.utils';

import './StudioTimers.scss';

interface StudioTimersProps {
  runtime: Runtime;
  time: TimerState;
  eventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  auxTimer: number;
  message: MessageState;
  viewSettings: ViewSettings;
}

export default function StudioTimers({
  runtime,
  time,
  eventNow,
  eventNext,
  auxTimer,
  message,
  viewSettings,
}: StudioTimersProps) {
  const { getLocalizedString } = useTranslation();

  const schedule = getFormattedScheduleTimes(runtime);
  const event = getFormattedEventData(eventNow, time);
  const eventNextTitle = eventNext?.title || '-';
  const formattedAuxTimer = millisToString(auxTimer);
  const secondary = message.secondary || '-';

  // gather presentation styles
  const timerColour = getTimerColour(viewSettings, time.phase === TimerPhase.Warning, time.phase === TimerPhase.Danger);

  return (
    <div className='studio__timers'>
      <div className='card' id='card-schedule'>
        <div className='card__row'>
          <div>
            <div className='label'>{getLocalizedString('common.started_at')}</div>
            <div className='runtime-timer'>{schedule.actualStart}</div>
          </div>
          <div>
            <div className='label center'>Offset</div>
            <div
              className={cx([
                'runtime-timer',
                'center',
                !eventNow && 'muted',
                runtime.offset <= 0 ? 'behind' : 'ahead',
              ])}
            >
              {schedule.offset}
            </div>
          </div>
          <div>
            <div className='label right'>{getLocalizedString('common.projected_end')}</div>
            <div className='runtime-timer right'>{schedule.expectedEnd}</div>
          </div>
        </div>
      </div>

      <div className='card' id='card-event-now'>
        <div className='card__row'>
          <div>
            <div className='label'>{getLocalizedString('common.now')}</div>
            <div className='title'>{event.title}</div>
          </div>
          <div>
            <div className='label right'>{getLocalizedString('common.next')}</div>
            <div className='title right'>{eventNextTitle}</div>
          </div>
        </div>
        <div
          className={cx([
            'event-timer',
            time.phase === TimerPhase.Overtime && 'event-timer--finished',
            time.playback === Playback.Pause && 'event-timer--paused',
          ])}
          style={{
            '--phase-color': timerColour,
          }}
          data-phase={time.phase}
        >
          {event.timer}
        </div>
        <div className='card__row'>
          <div>
            <div className='label'>{getLocalizedString('common.started_at')}</div>
            <div className='runtime-timer'>{event.startedAt}</div>
          </div>
          <div>
            <div className='label right'>{getLocalizedString('common.projected_end')}</div>
            <div className='runtime-timer right'>{event.expectedEnd}</div>
          </div>
        </div>
      </div>

      <div className='card' id='card-aux-1'>
        <div>
          <div className='label'>Aux 1</div>
          <div className='secondary-timer'>{formattedAuxTimer}</div>
        </div>
      </div>

      <div className='card' id='card-aux-2'>
        <div>
          <div className='label'>Aux 2</div>
          <div className='secondary-timer'>NOT YET</div>
        </div>
      </div>

      <div className='card' id='card-aux-3'>
        <div>
          <div className='label'>Aux 3</div>
          <div className='secondary-timer'>NOT YET</div>
        </div>
      </div>

      <div className='card' id='card-secondary'>
        <div>
          <div className='label'>Secondary message</div>
          <div className={cx(['secondary-timer', !message.secondary && 'muted'])}>{secondary}</div>
        </div>
      </div>
    </div>
  );
}
