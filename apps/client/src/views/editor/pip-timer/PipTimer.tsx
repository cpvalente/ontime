import { ViewSettings } from 'ontime-types';

import { FitText } from '../../../common/components/fit-text/FitText';
import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import { useTimerSocket } from '../../../common/hooks/useSocket';
import { cx } from '../../../common/utils/styleUtils';
import { getFormattedTimer, getTimerByType } from '../../../features/viewers/common/viewUtils';
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
  const showProgressBar = getShowProgressBar(timerTypeNow);

  // gather timer data
  const totalTime = getTotalTime(time.duration, time.addedTime);
  const stageTimer = getTimerByType(false, timerTypeNow, countToEndNow, clock, time, timerTypeNow);
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

  const secondaryContent = getSecondaryDisplay(message, currentAux, 'min', false, false, false);

  // gather presentation styles
  const resolvedTimerColour = getTimerColour(viewSettings, undefined, showWarning, showDanger);
  const { timerFontSize, externalFontSize } = getEstimatedFontSize(display, secondaryContent);
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
          data-phase={time.phase}
        >
          {display}
        </div>
        <div
          className={cx(['secondary', !secondaryContent && 'secondary--hidden'])}
          style={{ fontSize: `${externalFontSize}vw` }}
        >
          {secondaryContent}
        </div>
      </div>

      {showProgressBar && (
        <MultiPartProgressBar
          className={cx(['progress-container', !isPlaying && 'progress-container--paused'])}
          now={time.current}
          complete={totalTime}
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
