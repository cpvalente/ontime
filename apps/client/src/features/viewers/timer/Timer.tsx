import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EventData, OntimeEvent, Playback, TimerMessage, TimerType, ViewSettings } from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import MultiPartProgressBar from '../../../common/components/multi-part-progress-bar/MultiPartProgressBar';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import TitleCard from '../../../common/components/title-card/TitleCard';
import { TIMER_OPTIONS } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { TimeManagerType } from '../../../common/models/TimeManager.type';
import { formatTime } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';
import { formatTimerDisplay, getTimerByType } from '../common/viewerUtils';

import './Timer.scss';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

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
  general: EventData;
  pres: TimerMessage;
  eventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  time: TimeManagerType;
  viewSettings: ViewSettings;
}

export default function Timer(props: TimerProps) {
  const { isMirrored, pres, eventNow, eventNext, time, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const { getLocalizedString } = useTranslation();

  useEffect(() => {
    document.title = 'ontime - Timer';
  }, []);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  const clock = formatTime(time.clock, formatOptions);
  const showOverlay = pres.text !== '' && pres.visible;
  const isPlaying = time.playback !== Playback.Pause;

  const isNegative =
    (time.current ?? 0) < 0 && time.timerType !== TimerType.Clock && time.timerType !== TimerType.CountUp;
  const finished = time.playback === Playback.Play && (time.current ?? 0) < 0 && time.startedAt;
  const totalTime = (time.duration ?? 0) + (time.addedTime ?? 0);

  const showEndMessage = (time.current ?? 1) < 0 && viewSettings.endMessage;
  const showProgress = time.playback !== Playback.Stop;
  const showFinished = finished && (time.timerType !== TimerType.Clock || showEndMessage);
  const showWarning = (time.current ?? 1) < viewSettings.warningThreshold;
  const showDanger = (time.current ?? 1) < viewSettings.dangerThreshold;
  const showBlinking = pres.timerBlink;
  const showBlackout = pres.timerBlackout;
  const showClock = time.timerType !== TimerType.Clock;

  const timerColor =
    showProgress && showDanger
      ? viewSettings.dangerColor
      : showProgress && showWarning
      ? viewSettings.warningColor
      : viewSettings.normalColor;

  const stageTimer = getTimerByType(time);
  let display = formatTimerDisplay(stageTimer);
  const stageTimerCharacters = display.replace('/:/g', '').length;
  if (isNegative) {
    display = `-${display}`;
  }

  const baseClasses = `stage-timer ${isMirrored ? 'mirror' : ''} ${showBlackout ? 'blackout' : ''}`;
  const timerFontSize = 89 / (stageTimerCharacters - 1);
  const timerClasses = `timer ${!isPlaying ? 'timer--paused' : ''} ${showFinished ? 'timer--finished' : ''}`;

  return (
    <div className={showFinished ? `${baseClasses} stage-timer--finished` : baseClasses} data-testid='timer-view'>
      <NavigationMenu />
      <ViewParamsEditor paramFields={TIMER_OPTIONS} />
      <div className={showOverlay ? 'message-overlay message-overlay--active' : 'message-overlay'}>
        <div className={`message ${showBlinking ? 'blink' : ''}`}>{pres.text}</div>
      </div>

      <div className={`clock-container ${showClock ? '' : 'clock-container--hidden'}`}>
        <div className='label'>{getLocalizedString('common.time_now')}</div>
        <div className='clock'>{clock}</div>
      </div>

      <div className={`timer-container ${showBlinking ? (showOverlay ? '' : 'blink') : ''}`}>
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
      </div>

      <MultiPartProgressBar
        className={isPlaying ? 'progress-container' : 'progress-container progress-container--paused'}
        now={time.current || 0}
        complete={totalTime}
        normalColor={viewSettings.normalColor}
        warning={viewSettings.warningThreshold}
        warningColor={viewSettings.warningColor}
        danger={viewSettings.dangerThreshold}
        dangerColor={viewSettings.dangerColor}
        hidden={!showProgress}
      />

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
            <TitleCard label='now' title={eventNow.title} subtitle={eventNow.subtitle} presenter={eventNow.presenter} />
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
    </div>
  );
}
