import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EventData, Message, Playback, TimerType, ViewSettings } from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import ProgressBar from '../../../common/components/progress-bar/ProgressBar';
import TitleCard from '../../../common/components/title-card/TitleCard';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { TimeManagerType } from '../../../common/models/TimeManager.type';
import { formatTime } from '../../../common/utils/time';
import { formatTimerDisplay, getTimerByType } from '../common/viewerUtils';
import { TitleManager } from '../ViewWrapper';

import './Timer.scss';
import { useTranslation } from '../../../translation/TranslationProvider';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

// motion
const titleVariants = {
  hidden: {
    y: 500,
  },
  visible: {
    y: 0,
    transition: {
      duration: 1,
    },
  },
  exit: {
    y: 500,
  },
};

interface TimerProps {
  isMirrored: boolean;
  general: EventData;
  pres: Message;
  title: TitleManager;
  time: TimeManagerType;
  viewSettings: ViewSettings;
}

export default function Timer(props: TimerProps) {
  const { isMirrored, general, pres, title, time, viewSettings } = props;
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

  const showEndMessage = time.current < 0 && general.endMessage;
  const showProgress = time.playback !== Playback.Stop;
  const showFinished = time.finished && (time.timerType !== TimerType.Clock || showEndMessage);
  const showClock = time.timerType !== TimerType.Clock;
  const baseClasses = `stage-timer ${isMirrored ? 'mirror' : ''}`;

  const stageTimer = getTimerByType(time);
  let display = formatTimerDisplay(stageTimer);
  const stageTimerCharacters = display.replace('/:/g', '').length;
  if (isNegative) {
    display = `-${display}`;
  }

  const timerFontSize = 89 / (stageTimerCharacters - 1);
  const timerClasses = `timer ${!isPlaying ? 'timer--paused' : ''} ${showFinished ? 'timer--finished' : ''}`;

  return (
    <div className={showFinished ? `${baseClasses} stage-timer--finished` : baseClasses} data-testid='timer-view'>
      <NavigationMenu />
      <div className={showOverlay ? 'message-overlay message-overlay--active' : 'message-overlay'}>
        <div className='message'>{pres.text}</div>
      </div>

      <div className={`clock-container ${showClock ? '' : 'clock-container--hidden'}`}>
        <div className='label'>{getLocalizedString('common.time_now')}</div>
        <div className='clock'>{clock}</div>
      </div>

      <div className='timer-container'>
        {showEndMessage ? (
          <div className='end-message'>{general.endMessage}</div>
        ) : (
          <div
            className={timerClasses}
            style={{
              fontSize: `${timerFontSize}vw`,
            }}
          >
            {display}
          </div>
        )}
      </div>

      <ProgressBar
        className={isPlaying ? 'progress-container' : 'progress-container progress-container--paused'}
        now={time.current}
        complete={time.duration}
        hidden={!showProgress}
      />

      <AnimatePresence>
        {title.showNow && !time.finished && (
          <motion.div
            className='event now'
            key='now'
            variants={titleVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
          >
            <TitleCard label='now' title={title.titleNow} subtitle={title.subtitleNow} presenter={title.presenterNow} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {title.showNext && (
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
              title={title.titleNext}
              subtitle={title.subtitleNext}
              presenter={title.presenterNext}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
