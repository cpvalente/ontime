import { memo, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { CornerPipButton } from '../../common/components/editor-utils/EditorUtils';
import { FitText } from '../../common/components/fit-text/FitText';
import MultiPartProgressBar from '../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import TitleCard from '../../common/components/title-card/TitleCard';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import { useTimerSocket } from '../../common/hooks/useSocket';
import { usePipStore } from '../../common/stores/pipStore';
import { cx } from '../../common/utils/styleUtils';
import { formatTime } from '../../common/utils/time';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';
import { getFormattedTimer, getTimerByType } from '../../features/viewers/common/viewUtils';
import { getTimerColour } from '../../views/utils/presentation.utils';

import { useTimerOptions } from './timer.options';
import {
  getCardData,
  getEstimatedFontSize,
  getIsPlaying,
  getSecondaryDisplay,
  getShowClock,
  getShowMessage,
  getShowModifiers,
  getShowProgressBar,
  getTotalTime,
} from './timer.utils';
import { TimerData, useTimerData } from './useTimerData';

import './Timer.scss';

export default memo(PipTimerHost);
function PipTimerHost() {
  const { data } = useTimerData();
  const { root, setRoot } = usePipStore();

  const isPipSupported = 'documentPictureInPicture' in window;

  const openPictureInPicture = useCallback(async () => {
    if (!isPipSupported) return;

    if (window.documentPictureInPicture.window) {
      return
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

    PIP_ROOT.render(
      <BrowserRouter>
        <PipTimer data={data} />
      </BrowserRouter>,
    );
  }, [isPipSupported, setRoot, data])

  // re-render timer when data changes
  useEffect(() => {
    if (root) {
      root.render(
        <BrowserRouter>
          <PipTimer data={data} />
        </BrowserRouter>,
      );
    }
  }, [data, root]);

  if (!isPipSupported) {
    return null;
  }

  return (
    <CornerPipButton onClick={openPictureInPicture} />
  );
}

interface PipTimerProps {
  data: TimerData;
}

function PipTimer({ data }: PipTimerProps) {
  const { projectData, isMirrored, viewSettings } = data;
  const { eventNext, eventNow, message, time, clock, timerTypeNow, countToEndNow, auxTimer } = useTimerSocket();
  const {
    hideClock,
    hideCards,
    hideProgress,
    hideMessage,
    hideSecondary,
    hideLogo,
    hideTimerSeconds,
    removeLeadingZeros,
    mainSource,
    secondarySource,
    timerType,
    freezeOvertime,
    freezeMessage,
    hidePhase,
    font,
    keyColour,
    timerColour,
  } = useTimerOptions();

  const localisedMinutes = 'min';

  // gather modifiers
  const viewTimerType = timerType ?? timerTypeNow;
  const showOverlay = getShowMessage(message.timer);
  const { showEndMessage, showFinished, showWarning, showDanger } = getShowModifiers(
    timerTypeNow,
    countToEndNow,
    time.phase,
    freezeOvertime,
    freezeMessage,
    hidePhase,
  );
  const isPlaying = getIsPlaying(time.playback);
  const showClock = !hideClock && getShowClock(viewTimerType);
  const showProgressBar = !hideProgress && getShowProgressBar(viewTimerType);

  // gather card data
  const { showNow, nowMain, nowSecondary, showNext, nextMain, nextSecondary } = getCardData(
    eventNow,
    eventNext,
    mainSource,
    secondarySource,
    time.playback,
    time.phase,
  );

  // gather timer data
  const totalTime = getTotalTime(time.duration, time.addedTime);
  const formattedClock = formatTime(clock);
  const stageTimer = getTimerByType(freezeOvertime, timerTypeNow, countToEndNow, clock, time, timerType);
  const display = getFormattedTimer(stageTimer, viewTimerType, localisedMinutes, {
    removeSeconds: hideTimerSeconds,
    removeLeadingZero: removeLeadingZeros,
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

  const secondaryContent = getSecondaryDisplay(
    message,
    currentAux,
    localisedMinutes,
    hideTimerSeconds,
    removeLeadingZeros,
    hideSecondary,
  );

  // gather presentation styles
  const resolvedTimerColour = getTimerColour(viewSettings, timerColour, showWarning, showDanger);
  const { timerFontSize, externalFontSize } = getEstimatedFontSize(display, secondaryContent);
  const userStyles = {
    ...(keyColour && { '--timer-bg': keyColour }),
    ...(resolvedTimerColour && { '--timer-colour': resolvedTimerColour }),
    ...(font && { '--timer-font': font }),
  };

  return (
    <div
      data-testid='timer-view'
      className={cx(['stage-timer', isMirrored && 'mirror', showFinished && 'stage-timer--finished'])}
      style={userStyles}
    >
      {!hideLogo && projectData?.logo && <ViewLogo name={projectData.logo} className='logo' />}

      <div className={cx(['blackout', message.timer.blackout && 'blackout--active'])} />

      {!hideMessage && (
        <div className={cx(['message-overlay', showOverlay && 'message-overlay--active'])}>
          <FitText mode='multi' min={32} max={256} className={cx(['message', message.timer.blink && 'blink'])}>
            {message.timer.text}
          </FitText>
        </div>
      )}

      {showClock && (
        <div className='clock-container'>
          <div className='label'>Time now</div>
          <SuperscriptTime time={formattedClock} className='clock' />
        </div>
      )}

      <div className={cx(['timer-container', message.timer.blink && !showOverlay && 'blink'])}>
        {showEndMessage ? (
          <FitText mode='multi' min={64} max={256} className='end-message'>
            {freezeMessage}
          </FitText>
        ) : (
          <div
            className={cx(['timer', !isPlaying && 'timer--paused', showFinished && 'timer--finished'])}
            style={{ fontSize: `${timerFontSize}vw` }}
            data-phase={time.phase}
          >
            {display}
          </div>
        )}
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

      {!hideCards && (
        <>
          {showNow && <TitleCard className='event now' label='now' title={nowMain} secondary={nowSecondary} />}
          {showNext && <TitleCard className='event next' label='next' title={nextMain} secondary={nextSecondary} />}
        </>
      )}
    </div>
  );
}
