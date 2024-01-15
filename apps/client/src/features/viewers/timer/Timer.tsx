import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Message, OntimeEvent, Playback, Settings, TimerMessage, TimerType, ViewSettings } from 'ontime-types';
import { millisToString, removeLeadingZero, removeSeconds } from 'ontime-utils';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import TitleCard from '../../../common/components/title-card/TitleCard';
import { getTimerOptions } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { TimeManagerType } from '../../../common/models/TimeManager.type';
import { formatTime, getDefaultFormat } from '../../../common/utils/time';
import { isStringBoolean } from '../../../common/utils/viewUtils';
import { useTranslation } from '../../../translation/TranslationProvider';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getTimerByType } from '../common/viewerUtils';

import './Timer.scss';

// motion
const titleVariants = {
  hidden: {
    x: -2500,
  },
  visible: {
    x: 0,
    transition: {
      duration: 1,
    },
  },
  exit: {
    x: -2500,
  },
};

interface TimerProps {
  isMirrored: boolean;
  pres: TimerMessage;
  external: Message;
  eventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  time: TimeManagerType;
  viewSettings: ViewSettings;
  settings: Settings | undefined;
}

export default function Timer(props: TimerProps) {
  const { isMirrored, pres, eventNow, eventNext, time, viewSettings, external, settings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const { getLocalizedString } = useTranslation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'ontime - Timer';
  }, []);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  // USER OPTIONS
  const userOptions = {
    hideClock: false,
    hideCards: false,
    hideProgress: false,
    hideMessage: false,
    hideTimerSeconds: false,
    hideClockSeconds: false,
  };

  const hideClock = searchParams.get('hideClock');
  userOptions.hideClock = isStringBoolean(hideClock);

  const hideCards = searchParams.get('hideCards');
  userOptions.hideCards = isStringBoolean(hideCards);

  const hideProgress = searchParams.get('hideProgress');
  userOptions.hideProgress = isStringBoolean(hideProgress);

  const hideMessage = searchParams.get('hideMessage');
  userOptions.hideMessage = isStringBoolean(hideMessage);

  const hideClockSeconds = searchParams.get('hideClockSeconds');
  userOptions.hideClockSeconds = isStringBoolean(hideClockSeconds);
  const clock = formatTime(time.clock);

  const hideTimerSeconds = searchParams.get('hideTimerSeconds');
  userOptions.hideTimerSeconds = isStringBoolean(hideTimerSeconds);

  const showOverlay = pres.text !== '' && pres.visible;
  const isPlaying = time.playback !== Playback.Pause;

  const finished = time.playback === Playback.Play && (time.current ?? 0) < 0 && time.startedAt;
  const totalTime = (time.duration ?? 0) + (time.addedTime ?? 0);

  const showEndMessage = (time.current ?? 1) < 0 && viewSettings.endMessage;
  const showProgress = time.playback !== Playback.Stop;
  const showFinished = finished && (time.timerType !== TimerType.Clock || showEndMessage);
  const showWarning = (time.current ?? 1) < (eventNow?.timeWarning ?? 0);
  const showDanger = (time.current ?? 1) < (eventNow?.timeDanger ?? 0);
  const showBlinking = pres.timerBlink;
  const showBlackout = pres.timerBlackout;
  const showClock = time.timerType !== TimerType.Clock;
  const showExternal = external.visible && external.text;

  const timerColor =
    showProgress && showDanger
      ? viewSettings.dangerColor
      : showProgress && showWarning
      ? viewSettings.warningColor
      : viewSettings.normalColor;

  const stageTimer = getTimerByType(time);
  let display = millisToString(stageTimer, { fallback: '-- : -- : --' });
  if (stageTimer !== null) {
    if (hideTimerSeconds) {
      display = removeSeconds(display);
    }
    display = removeLeadingZero(display);
    // last unit rounds up in negative timers
    const isNegative = stageTimer ?? 0 < 0;
    if (isNegative && display === '0') {
      display = '-1';
    }
    if (display.length < 3) {
      display = `${display} ${getLocalizedString('common.minutes')}`;
    }
  }
  const stageTimerCharacters = display.replace('/:/g', '').length;

  const baseClasses = `stage-timer ${isMirrored ? 'mirror' : ''} ${showBlackout ? 'blackout' : ''}`;
  let timerFontSize = 89 / (stageTimerCharacters - 1);
  // we need to shrink the timer if the external is going to be there
  if (showExternal) {
    timerFontSize *= 0.8;
  }
  const externalFontSize = timerFontSize * 0.4;
  const timerContainerClasses = `timer-container ${showBlinking ? (showOverlay ? '' : 'blink') : ''}`;
  const timerClasses = `timer ${!isPlaying ? 'timer--paused' : ''} ${showFinished ? 'timer--finished' : ''}`;

  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const timerOptions = getTimerOptions(defaultFormat);

  return (
    <div className={showFinished ? `${baseClasses} stage-timer--finished` : baseClasses} data-testid='timer-view'>
      <NavigationMenu />
      <ViewParamsEditor paramFields={timerOptions} />
      {!userOptions.hideMessage && (
        <div className={showOverlay ? 'message-overlay message-overlay--active' : 'message-overlay'}>
          <div className={`message ${showBlinking ? 'blink' : ''}`}>{pres.text}</div>
        </div>
      )}

      {!userOptions.hideClock && (
        <div className={`clock-container ${showClock ? '' : 'clock-container--hidden'}`}>
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <SuperscriptTime time={clock} className='clock' />
        </div>
      )}

      <div className={timerContainerClasses}>
        {showEndMessage ? (
          <div className='end-message'>{viewSettings.endMessage}</div>
        ) : (
          <div
            className={timerClasses}
            style={{
              fontSize: `${timerFontSize}vw`,
              color: timerColor,
            }}
          >
            {display}
          </div>
        )}
        <div
          className={`external${showExternal ? '' : ' external--hidden'}`}
          style={{ fontSize: `${externalFontSize}vw` }}
        >
          {external.text}
        </div>
      </div>

      {!userOptions.hideProgress && (
        <MultiPartProgressBar
          className={isPlaying ? 'progress-container' : 'progress-container progress-container--paused'}
          now={time.current}
          complete={totalTime}
          normalColor={viewSettings.normalColor}
          warning={eventNow?.timeWarning}
          warningColor={viewSettings.warningColor}
          danger={eventNow?.timeDanger}
          dangerColor={viewSettings.dangerColor}
          hidden={!showProgress}
        />
      )}

      {!userOptions.hideCards && (
        <>
          <AnimatePresence>
            {eventNow && !finished && (
              <motion.div
                className='event now'
                key='now'
                variants={titleVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
              >
                <TitleCard
                  label='now'
                  title={eventNow.title}
                  subtitle={eventNow.subtitle}
                  presenter={eventNow.presenter}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {eventNext && (
              <motion.div
                className='event next'
                key='next'
                variants={titleVariants}
                initial='hidden'
                animate='visible'
                exit='exit'
              >
                <TitleCard
                  label='next'
                  title={eventNext.title}
                  subtitle={eventNext.subtitle}
                  presenter={eventNext.presenter}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
