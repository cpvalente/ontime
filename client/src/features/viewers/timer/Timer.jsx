import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TimerDisplay from 'common/components/countdown/TimerDisplay';
import MyProgressBar from 'common/components/myProgressBar/MyProgressBar';
import NavLogo from 'common/components/nav/NavLogo';
import TitleCard from 'common/components/views/TitleCard';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import style from './Timer.module.scss';

export default function Timer(props) {
  const { general, pres, title, time, settings } = props;
  const [elapsed, setElapsed] = useState(true);
  const [localTimeFormat, setLocalTimeFormat] = useState(null);
  const [searchParams] = useSearchParams();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Timer';
  }, []);

  // eg. http://localhost:3000/timer?progress=up&fprmat=12
  // Check for user options
  useEffect(() => {
    // progress: selector
    // Should be 'up' or 'down'
    const progress = searchParams.get('progress');
    if (progress === 'up') {
      setElapsed(true);
    } else if (progress === 'down') {
      setElapsed(false);
    }

    // format: selector
    // Should be '12' or '24'
    const format = searchParams.get('format');
    if (format === '12' || format === '24') {
      setLocalTimeFormat(format);
    }
  }, [searchParams]);

  const showOverlay = pres.text !== '' && pres.visible;
  const isPlaying = time.playstate !== 'pause';
  const normalisedTime = Math.max(time.running, 0);
  const clock = () => {
    if (localTimeFormat) {
      return localTimeFormat === '12' ? time.clock12 : time.clock;
    } else {
      return settings.timeFormat === '12' ? time.clock12 : time.clock;
    }
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

  return (
    <div className={time.finished ? style.container__grayFinished : style.container__gray}>
      <div className={showOverlay ? style.messageOverlayActive : style.messageOverlay}>
        <div className={style.message}>{pres.text}</div>
      </div>

      <NavLogo />

      <div className={style.clockContainer}>
        <div className={style.label}>Time Now</div>
        <div className={style.clock}>{clock()}</div>
      </div>

      <div className={style.timerContainer}>
        {time.finished ? (
          <div className={style.finished}>
            {general.endMessage == null || general.endMessage === '' ? (
              <TimerDisplay time={time.running} isNegative={time.isNegative} hideZeroHours />
            ) : (
              general.endMessage
            )}
          </div>
        ) : (
          <div className={isPlaying ? style.countdown : style.countdownPaused}>
            <TimerDisplay time={normalisedTime} hideZeroHours />
          </div>
        )}
      </div>

      {!time.finished && (
        <div className={isPlaying ? style.progressContainer : style.progressContainerPaused}>
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
            className={style.nowContainer}
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
            className={style.nextContainer}
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
  settings: PropTypes.object,
};
