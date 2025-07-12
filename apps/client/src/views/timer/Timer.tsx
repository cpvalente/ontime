import { CustomFields, MessageState, OntimeEvent, ProjectData, Settings, ViewSettings } from 'ontime-types';

import { FitText } from '../../common/components/fit-text/FitText';
import MultiPartProgressBar from '../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import TitleCard from '../../common/components/title-card/TitleCard';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useAuxTimersTime } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { cx } from '../../common/utils/styleUtils';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';
import { getFormattedTimer, getTimerByType } from '../../features/viewers/common/viewUtils';
import { useTranslation } from '../../translation/TranslationProvider';
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
  getTotalTime,
} from './timer.utils';

import './Timer.scss';

interface TimerProps {
  customFields: CustomFields;
  eventNext: OntimeEvent | null;
  eventNow: OntimeEvent | null;
  general: ProjectData;
  isMirrored: boolean;
  message: MessageState;
  settings: Settings | undefined;
  time: ViewExtendedTimer;
  viewSettings: ViewSettings;
}

export default function Timer({
  customFields,
  eventNow,
  eventNext,
  general,
  isMirrored,
  message,
  settings,
  time,
  viewSettings,
}: TimerProps) {
  const auxTimer = useAuxTimersTime();
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
    hideOvertime,
    font,
    keyColour,
    textColour,
  } = useTimerOptions();

  const { getLocalizedString } = useTranslation();
  const localisedMinutes = getLocalizedString('common.minutes');

  useWindowTitle('Timer');

  // gather modifiers
  const viewTimerType = timerType ?? time.timerType;
  const showOverlay = getShowMessage(message.timer);
  const { showEndMessage, showFinished, showWarning, showDanger } = getShowModifiers(
    time.timerType,
    time.countToEnd,
    time.phase,
    freezeOvertime,
    freezeMessage,
    hideOvertime,
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
  const clock = formatTime(time.clock);
  const stageTimer = getTimerByType(freezeOvertime, time, timerType);
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
  const timerColour = getTimerColour(viewSettings, showWarning, showDanger);
  const { timerFontSize, externalFontSize } = getEstimatedFontSize(display, secondaryContent);
  const userStyles = {
    ...(keyColour && { '--timer-bg': keyColour }),
    ...(textColour && { '--timer-colour': textColour }),
    ...(font && { '--timer-font': font }),
  };

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const timerOptions = getTimerOptions(defaultFormat, customFields);

  return (
    <div
      data-testid='timer-view'
      className={cx(['stage-timer', isMirrored && 'mirror', showFinished && 'stage-timer--finished'])}
      style={userStyles}
    >
      {!hideLogo && general?.logo && <ViewLogo name={general.logo} className='logo' />}

      <ViewParamsEditor viewOptions={timerOptions} />

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
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <SuperscriptTime time={clock} className='clock' />
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
            style={{
              fontSize: `${timerFontSize}vw`,
              '--phase-color': timerColour,
            }}
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
