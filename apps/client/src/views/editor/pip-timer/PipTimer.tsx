import { TimerType, ViewSettings } from 'ontime-types';

import { FitText } from '../../../common/components/fit-text/FitText';
import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import { useTimerSocket } from '../../../common/hooks/useSocket';
import { useAutoTickingClock } from '../../../common/stores/clockStore';
import { cx } from '../../../common/utils/styleUtils';
import { getFormattedTimer, getTimerByType } from '../../common/viewUtils';
import {
  getCurrentAux,
  getEstimatedFontSize,
  getIsPlaying,
  getSecondaryDisplay,
  getShowMessage,
  getShowModifiers,
  getShowProgressBar,
  getTimerSpots,
  getTotalTime,
} from '../../timer/timer.utils';
import { getTimerColour } from '../../utils/presentation.utils';

import './PipTimer.scss';

interface PipTimerProps {
  viewSettings: ViewSettings;
  /** sized by its container instead of the window */
  inline?: boolean;
}

export function PipTimer({ viewSettings, inline }: PipTimerProps) {
  const { eventNow, message, time, timerTypeNow, countToEndNow, auxTimer } = useTimerSocket();
  const clock = useAutoTickingClock();

  // gather modifiers
  const showOverlay = getShowMessage(message.timer);
  const { showFinished, showWarning, showDanger } = getShowModifiers(
    timerTypeNow,
    countToEndNow,
    time.phase,
    false,
    '',
    false,
  );
  const isPlaying = getIsPlaying(time.playback);
  const subduePaused = !isPlaying && timerTypeNow !== TimerType.Clock;
  const showProgressBar = getShowProgressBar(timerTypeNow);

  // gather timer data
  const totalTime = getTotalTime(time.duration, time.addedTime);
  const stageTimer = getTimerByType(false, timerTypeNow, clock, time, timerTypeNow);
  const display = getFormattedTimer(stageTimer, timerTypeNow, 'min', {
    removeSeconds: false,
    removeLeadingZero: true,
  });

  const currentAux = getCurrentAux(message, auxTimer);

  const secondaryContent = getSecondaryDisplay(message, currentAux, 'min', false, true, false);
  const spots = getTimerSpots(
    display,
    secondaryContent,
    message.timer.swap,
    message.timer.secondarySource === 'secondary',
  );

  // gather presentation styles
  const resolvedTimerColour = getTimerColour(viewSettings, undefined, showWarning, showDanger);
  // fitted text is capped at the size the timer would have in its place
  const timerFontSize = getEstimatedFontSize(spots.fitMain ? display : spots.main, spots.secondary);
  const userStyles = {
    '--timer-font-size': timerFontSize,
    ...(resolvedTimerColour && { '--timer-colour': resolvedTimerColour }),
  };

  return (
    <div
      className={cx([
        'pip-timer',
        inline && 'pip-timer--inline',
        showFinished && 'pip-timer--finished',
        message.timer.blackout && 'pip-timer--blackout',
      ])}
      style={userStyles}
    >
      {message.timer.blackout && <div className='blackout-label'>Blackout</div>}
      <div className={cx(['message-overlay', showOverlay && 'message-overlay--active'])}>
        <FitText mode='multi' min={12} max={256} className={cx(['message', message.timer.blink && 'blink'])}>
          {message.timer.text}
        </FitText>
        <div className='hidden-timer'>Timer {display}</div>
      </div>

      <div
        className={cx([
          'timer-container',
          spots.fitMain && 'timer-container--fit',
          message.timer.blink && !showOverlay && 'blink',
        ])}
      >
        {spots.fitMain ? (
          <FitText mode='multi' min={6} max={512} maxRatio={timerFontSize / 100} className='timer timer--fit'>
            <span className='timer__text'>{spots.main}</span>
          </FitText>
        ) : (
          <div
            className={cx([
              'timer',
              !spots.isSwapped && subduePaused && 'timer--paused',
              !spots.isSwapped && showFinished && 'timer--finished',
            ])}
            data-type={spots.isSwapped ? undefined : timerTypeNow}
            data-phase={!spots.isSwapped && (showWarning || showDanger) ? time.phase : undefined}
          >
            {spots.main}
          </div>
        )}
        <div
          className={cx(['secondary', !spots.secondary && 'secondary--hidden', spots.fitMain && 'secondary--compact'])}
        >
          <FitText mode='multi' min={6} max={256}>
            {spots.secondary}
          </FitText>
        </div>
      </div>

      {showProgressBar && (
        <MultiPartProgressBar
          className={cx(['progress-container', !isPlaying && 'progress-container--paused'])}
          now={time.current}
          complete={totalTime}
          eventId={eventNow?.id}
          normalColor={viewSettings.normalColor}
          warning={eventNow?.timeWarning}
          warningColor={viewSettings.warningColor}
          danger={eventNow?.timeDanger}
          dangerColor={viewSettings.dangerColor}
          hideOvertime={!showFinished}
        />
      )}
    </div>
  );
}
