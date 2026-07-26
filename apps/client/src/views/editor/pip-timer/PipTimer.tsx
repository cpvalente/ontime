import { TimerPhase, ViewSettings } from 'ontime-types';

import { FitText } from '../../../common/components/fit-text/FitText';
import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import { useGroupTimer } from '../../../common/hooks/useGroupTimer';
import { useTimerSocket } from '../../../common/hooks/useSocket';
import { cx } from '../../../common/utils/styleUtils';
import { getFormattedTimer, getTimerByType } from '../../common/viewUtils';
import {
  getEstimatedFontSize,
  getIsPlaying,
  getSecondaryDisplay,
  getShowMessage,
  getShowModifiers,
  getShowProgressBar,
  getTotalTime,
} from '../../timer/timer.utils';
import { getTimerColour } from '../../utils/presentation.utils';

import './PipTimer.scss';

interface PipTimerProps {
  viewSettings: ViewSettings;
}

export function PipTimer({ viewSettings }: PipTimerProps) {
  const { eventNow, message, time, clock, timerTypeNow, countToEndNow, auxTimer } = useTimerSocket();
  const groupTimer = useGroupTimer();

  // gather modifiers
  const showOverlay = getShowMessage(message.timer);
  const {
    showFinished: eventShowFinished,
    showWarning: eventShowWarning,
    showDanger: eventShowDanger,
  } = getShowModifiers(timerTypeNow, countToEndNow, time.phase, false, '', false);

  /**
   * warning and danger thresholds belong to the event, they carry no meaning against a group duration.
   * overtime is kept, but only once the group itself has run out of time
   */
  const showWarning = eventShowWarning && !groupTimer.isActive;
  const showDanger = eventShowDanger && !groupTimer.isActive;
  const showFinished = eventShowFinished && (!groupTimer.isActive || (groupTimer.current ?? 0) <= 0);

  const isPlaying = getIsPlaying(time.playback);
  const showProgressBar = getShowProgressBar(timerTypeNow);

  // gather timer data
  const totalTime = groupTimer.isActive ? groupTimer.duration : getTotalTime(time.duration, time.addedTime);
  const stageTimer = getTimerByType(false, timerTypeNow, clock, groupTimer.isActive ? groupTimer : time, timerTypeNow);
  const display = getFormattedTimer(stageTimer, timerTypeNow, 'min', {
    removeSeconds: false,
    removeLeadingZero: false,
  });

  const currentAux = (() => {
    if (message.timer.secondarySource === 'aux1') {
      return auxTimer.aux1;
    }
    if (message.timer.secondarySource === 'aux2') {
      return auxTimer.aux2;
    }
    if (message.timer.secondarySource === 'aux3') {
      return auxTimer.aux3;
    }
    return null;
  })();

  const secondaryContent = getSecondaryDisplay(message, currentAux, 'min', false, true, false);

  // gather presentation styles
  const resolvedTimerColour = getTimerColour(viewSettings, undefined, showWarning, showDanger);
  const timerFontSize = getEstimatedFontSize(display, secondaryContent);
  const userStyles = {
    ...(resolvedTimerColour && { '--timer-colour': resolvedTimerColour }),
  };

  return (
    <div className={cx(['pip-timer', showFinished && 'pip-timer--finished'])} style={userStyles}>
      <div className={cx(['message-overlay', showOverlay && 'message-overlay--active'])}>
        <FitText mode='multi' min={12} max={256} className={cx(['message', message.timer.blink && 'blink'])}>
          {message.timer.text}
        </FitText>
      </div>

      <div className='timer-container'>
        <div
          className={cx(['timer', !isPlaying && 'timer--paused', showFinished && 'timer--finished'])}
          style={{ fontSize: `${timerFontSize}vw` }}
          data-phase={groupTimer.isActive ? TimerPhase.Default : time.phase}
        >
          {display}
        </div>
        {groupTimer.isActive && <div className='group-indicator'>group</div>}
        <div className={cx(['secondary', !secondaryContent && 'secondary--hidden'])}>
          <FitText mode='multi' min={12} max={256}>
            {secondaryContent}
          </FitText>
        </div>
      </div>

      {showProgressBar && (
        <MultiPartProgressBar
          className={cx(['progress-container', !isPlaying && 'progress-container--paused'])}
          now={groupTimer.isActive ? groupTimer.current : time.current}
          complete={totalTime}
          normalColor={viewSettings.normalColor}
          warning={groupTimer.isActive ? undefined : eventNow?.timeWarning}
          warningColor={viewSettings.warningColor}
          danger={groupTimer.isActive ? undefined : eventNow?.timeDanger}
          dangerColor={viewSettings.dangerColor}
          hideOvertime={!showFinished}
        />
      )}
    </div>
  );
}
