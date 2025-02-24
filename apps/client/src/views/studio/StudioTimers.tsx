import { MessageState, OntimeEvent, Playback, Runtime, TimerPhase, TimerState, ViewSettings } from 'ontime-types';

import { cx } from '../../common/utils/styleUtils';
import { formatTime } from '../../common/utils/time';
import { useTranslation } from '../../translation/TranslationProvider';
import { getTimerColour } from '../utils/presentation.utils';

import { getFormattedEventData, getFormattedScheduleTimes } from './studioTimers.utils';

import './StudioTimers.scss';

interface StudioTimersProps {
  runtime: Runtime;
  time: TimerState;
  eventNow: OntimeEvent | null;
  auxTimer: number;
  message: MessageState;
  title: string;
  viewSettings: ViewSettings;
}

export default function StudioTimers(props: StudioTimersProps) {
  const { runtime, time, eventNow, auxTimer, message, title, viewSettings } = props;
  const { getLocalizedString } = useTranslation();

  const schedule = getFormattedScheduleTimes(runtime);
  const event = getFormattedEventData(eventNow, time);
  const formattedAuxTimer = formatTime(auxTimer);
  const secondary = message.external || '-';

  // gather presentation styles
  const timerColour = getTimerColour(viewSettings, time.phase === TimerPhase.Warning, time.phase === TimerPhase.Danger);

  return (
    <div className='studio__timers'>
      <div className='card'>
        <div className='title'>{title}</div>
        <div className='card__row'>
          <div>
            <div className='label'>{getLocalizedString('common.scheduled_start')}</div>
            <div className='runtime-timer'>{schedule.plannedStart}</div>
          </div>
          <div>
            <div className='label right'>{getLocalizedString('common.scheduled_end')}</div>
            <div className='runtime-timer right'>{schedule.plannedEnd}</div>
          </div>
        </div>
        <div className='card__row'>
          <div>
            <div className='label'>{getLocalizedString('common.started_at')}</div>
            <div className='runtime-timer'>{schedule.actualStart}</div>
          </div>
          <div>
            <div className='label center'>Offset</div>
            <div className={cx(['runtime-timer', 'center', runtime.offset <= 0 ? 'behind' : 'ahead'])}>
              {schedule.offset}
            </div>
          </div>
          <div>
            <div className='label right'>{getLocalizedString('common.projected_end')}</div>
            <div className='runtime-timer right'>{schedule.expectedEnd}</div>
          </div>
        </div>
      </div>
      <div className='card'>
        <div className='title'>{event.title}</div>
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
      <div className='card'>
        <div>
          <div className='label'>Aux 1</div>
          <div className='secondary-timer'>{formattedAuxTimer}</div>
        </div>
      </div>
      <div className='card'>
        <div>
          <div className='label'>External</div>
          <div className='secondary-timer'>{secondary}</div>
        </div>
      </div>
    </div>
  );
}
