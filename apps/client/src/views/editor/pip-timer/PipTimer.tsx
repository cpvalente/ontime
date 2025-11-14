import { memo, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { CornerPipButton } from '../../../common/components/editor-utils/EditorUtils';
import { FitText } from '../../../common/components/fit-text/FitText';
import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import { useTimerSocket } from '../../../common/hooks/useSocket';
import { usePipStore } from '../../../common/stores/pipStore';
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

import { PipTimerData, usePipTimerData } from './usePipTimerData';

import './PipTimer.scss';

export default memo(PipTimerHost);
function PipTimerHost() {
  const { data } = usePipTimerData();
  const { root, setRoot } = usePipStore();

  const isPipSupported = 'documentPictureInPicture' in window;

  const openPictureInPicture = useCallback(async () => {
    if (!isPipSupported) return;

    if (window.documentPictureInPicture.window) {
      return;
    }

    const pipWindow = await window.documentPictureInPicture.requestWindow();

    [...document.styleSheets].forEach((sheet) => {
      try {
        if (sheet.href) {
          const link = pipWindow.document.createElement('link');
          link.rel = 'stylesheet';
          link.href = sheet.href;
          pipWindow.document.head.appendChild(link);
        } else if (sheet.cssRules) {
          const style = pipWindow.document.createElement('style');
          style.textContent = [...sheet.cssRules].map((rule) => rule.cssText).join('');
          pipWindow.document.head.appendChild(style);
        }
      } catch (e) {
        console.warn('Stylesheet copy blocked:', e);
      }
    });

    const pipDiv = pipWindow.document.createElement('div');
    pipDiv.setAttribute('id', 'pip-root');
    pipWindow.document.body.append(pipDiv);

    const PIP_ROOT = createRoot(pipWindow.document.getElementById('pip-root')!, {
      onCaughtError: (err, _errInfo) => console.error(err),
      onUncaughtError: (err, _errInfo) => console.error(err),
      onRecoverableError: (err, _errInfo) => console.error(err),
    });

    pipWindow.addEventListener('pagehide', () => {
      PIP_ROOT.unmount();
      setRoot(null);
    });

    setRoot(PIP_ROOT);

    PIP_ROOT.render(<PipTimer data={data} />);
  }, [isPipSupported, setRoot, data]);

  // re-render timer when data changes
  useEffect(() => {
    if (root) {
      root.render(<PipTimer data={data} />);
    }
  }, [data, root]);

  if (!isPipSupported) {
    return null;
  }

  return <CornerPipButton onClick={openPictureInPicture} />;
}

interface PipTimerProps {
  data: PipTimerData;
}

function PipTimer({ data }: PipTimerProps) {
  const { viewSettings } = data;
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
        <FitText mode='multi' min={32} max={256} className={cx(['message', message.timer.blink && 'blink'])}>
          {message.timer.text}
        </FitText>
      </div>

      <div className={cx(['timer-container', message.timer.blink && !showOverlay && 'blink'])}>
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
