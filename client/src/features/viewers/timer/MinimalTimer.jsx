import React  from 'react';
import { useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';

import NavLogo from '../../../common/components/nav/NavLogo';
import { formatDisplay } from '../../../common/utils/dateConfig';

import style from './MinimalTimer.module.scss';

export default function MinimalTimer(props) {
  const { pres, time } = props;
  const [searchParams] = useSearchParams();

  document.title = 'ontime - Minimal Timer';

  // get config from url: key, text, font, size, hidenav, hideovertime
  // eg. http://localhost:3000/minimal?key=f00&text=fff
  // Check for user options
  const userOptions = {};

  // key: string
  // Should be a hex string '#00FF00' with key colour
  const key = searchParams.get('key');
  if (key) {
    userOptions.keyColour = `#${key}`;
  }

  // textColour: string
  // Should be a hex string '#ffffff'
  const textColour = searchParams.get('text');
  if (textColour) {
    userOptions.textColour = `#${textColour}`;
  }

  // font: string
  // Should be a string with a font name 'arial'
  const font = searchParams.get('font');
  if (font) {
    userOptions.font = font;
  }

  // size: multiplier
  // Should be a number 0.0-n
  const size = searchParams.get('size');
  if (size) {
    userOptions.size = size;
  }

  const hideNav = searchParams.get('hidenav');
  if (hideNav) {
    userOptions.hideNav = hideNav;
  }

  const hideOvertime = searchParams.get('hideovertime');
  if (hideOvertime) {
    userOptions.hideOvertime = hideOvertime;
  }

  const showOverlay = pres.text !== '' && pres.visible;
  const isPlaying = time.playstate !== 'pause';
  const timer = formatDisplay(time.running, true);
  const clean = timer.replace('/:/g', '');
  const finishedStyle = userOptions?.hideOvertime ? style.container : style.containerFinished;

  return (
    <div
      className={time.finished ? finishedStyle : style.container}
      style={{
        backgroundColor: userOptions.keyColour,
        color: userOptions.textColour,
      }}
      data-testid='minimal-timer'
    >
      <div className={showOverlay ? style.messageOverlayActive : style.messageOverlay}>
        <div className={style.message}>{pres.text}</div>
      </div>
      {!userOptions?.hideNav && <NavLogo />}
      <div
        className={isPlaying ? style.timer : style.timerPaused}
        style={{
          fontSize: `${(89 / (clean.length - 1)) * userOptions.size}vw`,
          fontFamily: userOptions.font,
        }}
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
