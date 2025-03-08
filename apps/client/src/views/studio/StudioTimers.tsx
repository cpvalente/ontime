import { MessageState, OntimeEvent, Runtime, TimerState } from 'ontime-types';

import { formatTime } from '../../common/utils/time';
import { useTranslation } from '../../translation/TranslationProvider';

import { getFormattedEventData, getFormattedScheduleTimes } from './studioTimers.utils';

import './StudioTimers.scss';

interface StudioTimersProps {
  runtime: Runtime;
  time: TimerState;
  eventNow: OntimeEvent | null;
  auxTimer: number;
  message: MessageState;
  title: string;
}

export default function StudioTimers(props: StudioTimersProps) {
  const { runtime, time, eventNow, auxTimer, message, title } = props;
  const { getLocalizedString } = useTranslation();

  const schedule = getFormattedScheduleTimes(runtime);
  const event = getFormattedEventData(eventNow, time);
  const auxTimmer = formatTime(auxTimer);
  const secondary = message.external || '-';

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
            <div className='runtime-timer center'>{schedule.offset}</div>
          </div>
          <div>
            <div className='label right'>{getLocalizedString('common.projected_end')}</div>
            <div className='runtime-timer right'>{schedule.expectedEnd}</div>
          </div>
        </div>
      </div>
      <div className='card'>
        <div className='title'>{event.title}</div>
        <div className='event-timer'>{event.timer}</div>
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
        <div className='label'>Aux 1</div>
        <div className='secondary-timer'>{auxTimmer}</div>
      </div>
      <div className='card'>
        <div className='label'>External</div>
        <div className='secondary-timer'>{secondary}</div>
      </div>
    </div>
  );
}
