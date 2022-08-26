import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TimerDisplay from 'common/components/countdown/TimerDisplay';
import MyProgressBar from 'common/components/myProgressBar/MyProgressBar';
import NavLogo from 'common/components/nav/NavLogo';
import TitleCard from 'common/components/views/TitleCard';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import './Timer.scss';

export default function Timer(props) {
  const { general, pres, title, time } = props;
  const [elapsed, setElapsed] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'ontime - Timer';
  }, []);

  // eg. http://localhost:3000/timer?progress=up
  // Check for user options
  // progress: selector
  // Should be 'up' or 'down'
  const progress = searchParams.get('progress');
  if (progress === 'up') {
    setElapsed(true);
  } else if (progress === 'down') {
    setElapsed(false);
  }

  const showOverlay = pres.text !== '' && pres.visible;
  const isPlaying = time.playstate !== 'pause';
  const normalisedTime = Math.max(time.running, 0);

  // show timer if end message is empty
  const endMessage =
    general.endMessage == null || general.endMessage === '' ? (
      <TimerDisplay time={time.running} isNegative={time.isNegative} hideZeroHours />
    ) : (
      general.endMessage
    );

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

  return (
    <div className={time.finished ? 'container container--finished' : 'container'}>
      <div className={showOverlay ? 'message-overlay message-overlay--active' : 'message-overlay'}>
        <div className='message'>{pres.text}</div>
      </div>

      <NavLogo />

      <div className='clock-container'>
        <div className='label'>Time Now</div>
        <div className='clock'>{time.clock}</div>
      </div>

      <div className='timer-container'>
        {time.finished ? (
          <div className='finished'>{endMessage}</div>
        ) : (
          <div className={isPlaying ? 'countdown' : 'countdown--paused'}>
            <TimerDisplay time={normalisedTime} hideZeroHours />
          </div>
        )}
      </div>

      {!time.finished && (
        <div className={isPlaying ? 'progress-container' : 'progress-container--paused'}>
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
            className='now-container'
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
            className='next-container'
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
};
