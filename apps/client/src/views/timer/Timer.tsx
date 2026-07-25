import { MaybeString, OntimeView, TimerType } from 'ontime-types';
import { useMemo } from 'react';

import { FitText } from '../../common/components/fit-text/FitText';
import MultiPartProgressBar from '../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import EmptyPage from '../../common/components/state/EmptyPage';
import TitleCard from '../../common/components/title-card/TitleCard';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useAutoTickingClock } from '../../common/hooks/useAutoTickingClock';
import { useTimerSocket } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { cx } from '../../common/utils/styleUtils';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import { useTranslation } from '../../translation/TranslationProvider';
import Loader from '../common/loader/Loader';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getFormattedTimer, getTimerByType } from '../common/viewUtils';
import { getTimerColour } from '../utils/presentation.utils';
import { getTimerOptions, useTimerOptions } from './timer.options';
import {
  getCardData,
  getEstimatedFontSize,
  getIsPlaying,
  getSecondaryDisplay,
  getShowClock,
  getShowMessage,
  getShowModifiers,
  getShowProgressBar,
  getTimerSlots,
  getTotalTime,
} from './timer.utils';
import { TimerData, useTimerData } from './useTimerData';

import './Timer.scss';

export default function TimerLoader() {
  const { data, status } = useTimerData();

  useWindowTitle('Timer');

  if (status === 'pending') {
    return <Loader />;
  }

  if (status === 'error') {
    return <EmptyPage text='There was an error fetching data, please refresh the page.' />;
  }

  return <Timer {...data} />;
}

function Timer({ customFields, projectData, isMirrored, settings, viewSettings, entries }: TimerData) {
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
    timeformat,
  } = useTimerOptions();

  const { getLocalizedString } = useTranslation();
  const localisedMinutes = getLocalizedString('common.minutes');

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
    entries,
  );

  // gather timer data
  const totalTime = getTotalTime(time.duration, time.addedTime);
  const stageTimer = getTimerByType(freezeOvertime, timerTypeNow, clock, time, timerType);
  const display = getFormattedTimer(stageTimer, viewTimerType, localisedMinutes, {
    removeSeconds: hideTimerSeconds,
    removeLeadingZero: removeLeadingZeros,
    clockFormat: timeformat,
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

  // when the operator promotes the secondary source to the main slot, swap the two so the event
  // timer is demoted (never removed). Frozen overtime end-messages keep the event timer prominent.
  const isSwapped = message.timer.secondaryPlacement === 'main' && Boolean(secondaryContent) && !showEndMessage;
  const { main: mainSlot, secondary: secondarySlot } = getTimerSlots(
    isSwapped,
    { content: display, timerType: viewTimerType, phase: time.phase },
    secondaryContent,
  );

  // gather presentation styles
  const resolvedTimerColour = getTimerColour(viewSettings, timerColour, showWarning, showDanger);
  const timerFontSize = getEstimatedFontSize(mainSlot.content ?? display, secondarySlot.content);
  const subduePaused = !isPlaying && viewTimerType !== TimerType.Clock;
  const userStyles = {
    ...(keyColour && { '--timer-bg': keyColour }),
    ...(font && { '--timer-font': font }),
  };
  // the event timer keeps its (phase-aware) colour in whichever slot it occupies
  const eventTimerColour = resolvedTimerColour ? { '--timer-colour': resolvedTimerColour } : undefined;

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const timerOptions = useMemo(() => getTimerOptions(defaultFormat, customFields), [customFields, defaultFormat]);

  return (
    <div
      data-testid='timer-view'
      className={cx(['stage-timer', isMirrored && 'mirror', showFinished && 'stage-timer--finished'])}
      style={userStyles}
    >
      {!hideLogo && projectData?.logo && <ViewLogo name={projectData.logo} className='logo' />}

      <ViewParamsEditor target={OntimeView.Timer} viewOptions={timerOptions} />

      <div className={cx(['blackout', message.timer.blackout && 'blackout--active'])} />

      {!hideMessage && (
        <div className={cx(['message-overlay', showOverlay && 'message-overlay--active'])}>
          <FitText mode='multi' min={32} max={256} className={cx(['message', message.timer.blink && 'blink'])}>
            {message.timer.text}
          </FitText>
        </div>
      )}

      {showClock && <TimerAutoTickingClock clockFormat={timeformat} />}

      <div className={cx(['timer-container', message.timer.blink && !showOverlay && 'blink'])}>
        {showEndMessage ? (
          <FitText mode='multi' min={64} max={256} className='end-message'>
            {freezeMessage}
          </FitText>
        ) : (
          <div
            className={cx([
              'timer',
              mainSlot.isEventTimer && subduePaused && 'timer--paused',
              mainSlot.isEventTimer && showFinished && 'timer--finished',
            ])}
            style={{ fontSize: `${timerFontSize}vw`, ...(mainSlot.isEventTimer ? eventTimerColour : {}) }}
            data-type={mainSlot.timerType}
            data-phase={mainSlot.phase}
          >
            {mainSlot.content}
          </div>
        )}
        <div
          className={cx([
            'secondary',
            !secondarySlot.content && 'secondary--hidden',
            secondarySlot.isEventTimer && 'secondary--as-timer',
            secondarySlot.isEventTimer && subduePaused && 'secondary--paused',
            secondarySlot.isEventTimer && showFinished && 'secondary--finished',
          ])}
          style={secondarySlot.isEventTimer ? eventTimerColour : undefined}
          data-type={secondarySlot.timerType}
          data-phase={secondarySlot.phase}
        >
          <FitText mode='multi' min={64} max={256}>
            {secondarySlot.content}
          </FitText>
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

function TimerAutoTickingClock({ clockFormat }: { clockFormat: MaybeString }) {
  const autoTickingClock = useAutoTickingClock();
  const formattedClock = formatTime(autoTickingClock, { override: clockFormat });
  const { getLocalizedString } = useTranslation();

  return (
    <div className='clock-container'>
      <div className='label'>{getLocalizedString('common.time_now')}</div>
      <SuperscriptTime time={formattedClock} className='clock' />
    </div>
  );
}
