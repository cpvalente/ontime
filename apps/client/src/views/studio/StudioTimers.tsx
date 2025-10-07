import { Playback, TimerPhase, ViewSettings } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { useAuxTimersTime, useStudioTimersSocket } from '../../common/hooks/useSocket';
import { getOffsetState } from '../../common/utils/offset';
import { cx } from '../../common/utils/styleUtils';
import { useTranslation } from '../../translation/TranslationProvider';
import { getTimerColour } from '../utils/presentation.utils';

import { getFormattedEventData, getFormattedScheduleTimes } from './studioTimers.utils';

import './StudioTimers.scss';

interface StudioTimersProps {
  viewSettings: ViewSettings;
}

export default function StudioTimers({ viewSettings }: StudioTimersProps) {
  const { getLocalizedString } = useTranslation();
  const { eventNow, eventNext, message, time, offset, rundown, expectedRundownEnd } = useStudioTimersSocket();

  const schedule = getFormattedScheduleTimes({
    offset: offset,
    actualStart: rundown.actualStart,
    expectedEnd: expectedRundownEnd,
  });
  const event = getFormattedEventData(eventNow, time);
  const eventNextTitle = eventNext?.title || '-';
  const formattedTimerMessage = (message.timer.visible && message.timer.text) || '-';
  const formattedSecondaryMessage = message.timer.secondarySource === 'secondary' ? message.secondary || '-' : '-';

  // gather presentation styles
  const timerColour = getTimerColour(
    viewSettings,
    undefined,
    time.phase === TimerPhase.Warning,
    time.phase === TimerPhase.Danger,
  );

  const offsetState = getOffsetState(offset);

  return (
    <div className='studio__timers'>
      <div className='card' id='card-schedule'>
        <div className='card__row'>
          <div>
            <div className='label'>{getLocalizedString('common.started_at')}</div>
            <div className='runtime-timer'>{schedule.actualStart}</div>
          </div>
          <div>
            <div className='label center'>Over / under</div>
            <div className={cx(['runtime-timer', 'center', !eventNow && 'muted', offsetState && offsetState])}>
              {schedule.offset}
            </div>
          </div>
          <div>
            <div className='label right'>{getLocalizedString('common.expected_end')}</div>
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

        <div className='card__row'>
          <div>
            <div className='label'>{getLocalizedString('common.started_at')}</div>
            <div className='runtime-timer'>{event.startedAt}</div>
          </div>
          <div>
            <div className='label' />
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
          </div>
          <div>
            <div className='label right'>{getLocalizedString('common.expected_end')}</div>
            <div className='runtime-timer right'>{event.expectedEnd}</div>
          </div>
        </div>
      </div>

      <StudioTimersAux />

      <div className='card' id='card-timer-message'>
        <div>
          <div className='label'>Timer message</div>
          <div className={cx(['extra', !formattedTimerMessage && 'muted'])}>{formattedTimerMessage}</div>
        </div>
      </div>

      <div className='card' id='card-secondary-message'>
        <div>
          <div className='label'>Secondary message</div>
          <div className={cx(['extra', !formattedSecondaryMessage && 'muted'])}>{formattedSecondaryMessage}</div>
        </div>
      </div>
    </div>
  );
}

function StudioTimersAux() {
  const auxTimer = useAuxTimersTime();

  return (
    <div className='card' id='card-aux'>
      <div className='card__row'>
        <div>
          <div className='label'>Aux 1</div>
          <div className='extra'>{millisToString(auxTimer.aux1)}</div>
        </div>

        <div>
          <div className='label center'>Aux 2</div>
          <div className='extra center'>{millisToString(auxTimer.aux2)}</div>
        </div>

        <div>
          <div className='label right'>Aux 3</div>
          <div className='extra right'>{millisToString(auxTimer.aux3)}</div>
        </div>
      </div>
    </div>
  );
}
