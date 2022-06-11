import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import NavLogo from '../../../common/components/nav/NavLogo';
import { formatDisplay } from '../../../common/utils/dateConfig';

import style from './MinimalTimer.module.scss';

export default function MinimalTimer(props) {
  const { pres, time } = props;

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Minimal Timer';
  }, []);

  const showOverlay = pres.text !== '' && pres.visible;
  const isPlaying = time.playstate !== 'pause';
  const timer = formatDisplay(time.running, true);
  const clean = timer.replace('/:/g', '');

  return (
    <div className={time.finished ? style.containerFinished : style.container}>
      <div className={showOverlay ? style.messageOverlayActive : style.messageOverlay}>
        <div className={style.message}>{pres.text}</div>
      </div>
      <NavLogo />
      <div
        style={{ fontSize: `${89 / (clean.length - 1)}vw` }}
        className={isPlaying ? style.timer : style.timerPaused}
      >
        {time.isNegative ? `-${timer}` : timer}
      </div>
    </div>
  );
}

MinimalTimer.propTypes = {
  pres: PropTypes.object,
  time: PropTypes.object,
};
