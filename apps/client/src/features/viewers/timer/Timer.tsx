import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAtom } from 'jotai';
import { TimerType } from 'ontime-types';
import PropTypes from 'prop-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import { mirrorViewersAtom } from '../../../common/atoms/ViewerSettings';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import ProgressBar from '../../../common/components/progress-bar/ProgressBar';
import TimerDisplay from '../../../common/components/timer-display/TimerDisplay';
import TitleCard from '../../../common/components/title-card/TitleCard';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { formatDisplay, millisToSeconds } from '../../../common/utils/dateConfig';
import { formatTime } from '../../../common/utils/time';
import { getTimerByType } from '../common/viewerUtils';

import './Timer.scss';

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

Timer.propTypes = {
  general: PropTypes.object,
  pres: PropTypes.object,
  title: PropTypes.object,
  time: PropTypes.object,
  viewSettings: PropTypes.object,
};

// @ts-expect-error unable to type just yet
export default function Timer(props) {
  const { general, pres, title, time, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [isMirrored] = useAtom(mirrorViewersAtom);

  useEffect(() => {
    document.title = 'ontime - Timer';
  }, []);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  const clock = formatTime(time.clock, formatOptions);
  const showOverlay = pres.text !== '' && pres.visible;
  const isPlaying = time.playback !== 'pause';
  const isNegative =
    (time.current ?? 0) < 0 && time.timerType !== TimerType.Clock && time.timerType !== TimerType.CountUp;

  const showEndMessage = time.current < 0 && general.endMessage;
  const showProgress = time.playback !== 'stop';
  const showFinished = time.finished && time.timerType !== TimerType.Clock;
  const showClock = time.timerType !== TimerType.Clock;
  const baseClasses = `stage-timer ${isMirrored ? 'mirror' : ''}`;

  const stageTimer = getTimerByType(time);

  let display = '';

  if (typeof stageTimer === 'string') {
    display = stageTimer;
  } else if (stageTimer === null || typeof stageTimer === 'undefined' || isNaN(stageTimer)) {
    display = '-- : -- : --';
  } else {
    display = formatDisplay(millisToSeconds(stageTimer), true);
  }

  if (isNegative) {
    display = `-${display}`;
  }

  const stageTimerCharacters = display.replace('/:/g', '').length;

  return (
    <div className={showFinished ? `${baseClasses} stage-timer--finished` : baseClasses} data-testid='timer-view'>
      <NavigationMenu />
      <div className={showOverlay ? 'message-overlay message-overlay--active' : 'message-overlay'}>
        <div className='message'>{pres.text}</div>
      </div>

      <div
        className='clock-container'
        style={{
          opacity: `${showClock ? 1 : 0}`,
        }}
      >
        <div className='label'>Time Now</div>
        <div className='clock'>{clock}</div>
      </div>

      <div
        className='timer-container'
        style={{
          fontSize: `${100 / stageTimerCharacters}vw`,
        }}
      >
        {showEndMessage ? (
          <div className='end-message'>{general.endMessage}</div>
        ) : (
          <div className={`timer ${!isPlaying ? 'timer--paused' : ''} ${showFinished ? 'timer--finished' : ''}`}>
            {display}
          </div>
          // <TimerDisplay time={display} hideZeroHours className={isPlaying ? 'timer' : 'timer--paused'} />
        )}
      </div>

      <ProgressBar
        className={isPlaying ? 'progress-container' : 'progress-container progress-container--paused'}
        now={time.current}
        complete={time.duration}
        hidden={!showProgress}
      />

      <AnimatePresence>
        {title.showNow && (
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
