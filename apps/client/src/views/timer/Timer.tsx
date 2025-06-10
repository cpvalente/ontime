import {
  CustomFields,
  MessageState,
  OntimeEvent,
  ProjectData,
  Settings,
  SimpleTimerState,
  ViewSettings,
} from 'ontime-types';

import { FitText } from '../../common/components/fit-text/FitText';
import MultiPartProgressBar from '../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import TitleCard from '../../common/components/title-card/TitleCard';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { cx } from '../../common/utils/styleUtils';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';
import { getFormattedTimer, getTimerByType } from '../../features/viewers/common/viewUtils';
import { useTranslation } from '../../translation/TranslationProvider';

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
  getTimerColour,
  getTotalTime,
} from './timer.utils';

import './Timer.scss';

interface TimerProps {
  auxTimer: SimpleTimerState;
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

export default function Timer(props: TimerProps) {
  const { auxTimer, customFields, eventNow, eventNext, general, isMirrored, message, settings, time, viewSettings } =
    props;

  const {
    hideClock,
    hideCards,
    hideProgress,
    hideMessage,
    hideExternal,
    hideTimerSeconds,
    removeLeadingZeros,
    mainSource,
    secondarySource,
    timerType,
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
    viewSettings,
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
  const stageTimer = getTimerByType(viewSettings.freezeEnd, time, timerType);
  const display = getFormattedTimer(stageTimer, viewTimerType, localisedMinutes, {
    removeSeconds: hideTimerSeconds,
    removeLeadingZero: removeLeadingZeros,
  });

  const secondaryContent = getSecondaryDisplay(
    message,
    auxTimer.current,
    localisedMinutes,
    hideTimerSeconds,
    removeLeadingZeros,
    hideExternal,
  );

  // gather presentation styles
  const timerColour = getTimerColour(viewSettings, showWarning, showDanger);
  const { timerFontSize, externalFontSize } = getEstimatedFontSize(display, secondaryContent);

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const timerOptions = getTimerOptions(defaultFormat, customFields);

  return (
    <div
      className={cx(['stage-timer', isMirrored && 'mirror', showFinished && 'stage-timer--finished'])}
      data-testid='timer-view'
    >
      {general?.projectLogo && <ViewLogo name={general.projectLogo} className='logo' />}

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
            {viewSettings.endMessage}
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
