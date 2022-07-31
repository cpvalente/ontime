import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';

import NavLogo from '../../../common/components/nav/NavLogo';
import { formatDisplay } from '../../../common/utils/dateConfig';

import style from './MinimalTimer.module.scss';

export default function MinimalTimer(props) {
  const { pres, time } = props;
  const [searchParams] = useSearchParams();
  const [userOptions, setUserOptions] = useState({});

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Minimal Timer';
  }, []);

  // get config from url: key, text, font, size, hidenav, hideovertime
  // eg. http://localhost:3000/minimal?key=f00&text=fff
  // Check for user options
  useEffect(() => {
    const options = {};

    // key: string
    // Should be a hex string '#00FF00' with key colour
    const key = searchParams.get('key');
    if (key) {
      options.keyColour = `#${key}`;
    }

    // textColour: string
    // Should be a hex string '#ffffff'
    const textColour = searchParams.get('text');
    if (textColour) {
      options.textColour = `#${textColour}`;
    }

    // font: string
    // Should be a string with a font name 'arial'
    const font = searchParams.get('font');
    if (font) {
      options.font = font;
    }

    // size: multiplier
    // Should be a number 0.0-n
    const size = searchParams.get('size');
    if (size) {
      options.size = size;
    }

    const hideNav = searchParams.get('hidenav')
    if (hideNav) {
      options.hideNav = hideNav;
    }

    const hideOvertime = searchParams.get('hideovertime')
    if (hideOvertime) {
      options.hideOvertime = hideOvertime;
    }

    setUserOptions({
      ...options,
      set: true,
    });
  }, [searchParams]);

  // Defer rendering until we have data ready
  if (!userOptions?.set) return null;

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
    >
      <div className={showOverlay ? style.messageOverlayActive : style.messageOverlay}>
        <div className={style.message}>{pres.text}</div>
      </div>
      {!userOptions?.hideNav && <NavLogo />}
      <div
        className={isPlaying ? style.timer : style.timerPaused}
        style={{
          fontSize: `${(89 / (clean.length - 1) * userOptions.size)}vw`,
          fontFamily: userOptions.font
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
