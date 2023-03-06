import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TimerDisplay from 'common/components/countdown/TimerDisplay';
import MyProgressBar from 'common/components/myProgressBar/MyProgressBar';
import NavLogo from 'common/components/nav/NavLogo';
import TitleCard from 'common/components/title-card/TitleCard';
import { AnimatePresence, motion } from 'framer-motion';
import { useAtom } from 'jotai';
import PropTypes from 'prop-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import { mirrorViewersAtom } from '../../../common/atoms/ViewerSettings';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { formatTime } from '../../../common/utils/time';

import './Timer.scss';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

export default function Timer(props) {
  const { general, pres, title, time, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);

  const [searchParams] = useSearchParams();
  const [elapsed, setElapsed] = useState(() => {
    // eg. http://localhost:3000/timer?progress=up
    // Check for user options
    // progress: selector
    // Should be 'up' or 'down'
    const progress = searchParams.get('progress');
    return progress === 'up';
  });

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
  const isPlaying = time.playstate !== 'pause';
  const normalisedTime = Math.max(time.running, 0);

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
  const baseClasses = `stage-timer ${isMirrored ? 'mirror' : ''}`;

  return (
    <div className={time.finished ? `${baseClasses} stage-timer--finished` : baseClasses}>
      <div className={showOverlay ? 'message-overlay message-overlay--active' : 'message-overlay'}>
        <div className='message'>{pres.text}</div>
      </div>

      <NavLogo />

      <div className='clock-container'>
        <div className='label'>Time Now</div>
        <div className='clock'>{clock}</div>
      </div>

      <div className='timer-container'>
        {time.finished ? (
          <div className='end-message'>
            {general.endMessage == null || general.endMessage === '' ? (
              <TimerDisplay time={time.running} isNegative={time.isNegative} hideZeroHours />
            ) : (
              general.endMessage
            )}
          </div>
        ) : (
          <div className={isPlaying ? 'timer' : 'timer--paused'}>
            <TimerDisplay time={normalisedTime} hideZeroHours />
          </div>
        )}
      </div>

      {!time.finished && (
        <div
          className={
            isPlaying ? 'progress-container' : 'progress-container progress-container--paused'
          }
        >
          <MyProgressBar
            now={normalisedTime}
            complete={time.durationSeconds}
            showElapsed={elapsed}
          />
        </div>
      )}

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
            <TitleCard
              label='Now'
              title={title.titleNow}
              subtitle={title.subtitleNow}
              presenter={title.presenterNow}
            />
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
              label='Next'
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

Timer.propTypes = {
  general: PropTypes.object,
  pres: PropTypes.object,
  title: PropTypes.object,
  time: PropTypes.object,
  viewSettings: PropTypes.object,
};
