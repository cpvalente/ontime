import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import NavLogo from '../../../common/components/nav/NavLogo';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { formatDisplay } from '../../../common/utils/dateConfig';

import './MinimalTimer.scss';

export default function MinimalTimer(props) {
  const { pres, time, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'ontime - Minimal Timer';
  }, []);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

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

  // alignX: flex justification
  // start | center | end
  const alignX = searchParams.get('alignx');
  if (alignX) {
    if (alignX === 'start' || alignX === 'center' || alignX === 'end') {
      userOptions.justifyContent = alignX;
    }
  }

  // alignX: flex alignment
  // start | center | end
  const alignY = searchParams.get('aligny');
  if (alignY) {
    if (alignY === 'start' || alignY === 'center' || alignY === 'end') {
      userOptions.alignItems = alignY;
    }
  }

  // offsetX: position in pixels
  // Should be a number 0 - 1920
  const offsetX = searchParams.get('offsetx');
  if (offsetX) {
    const pixels = Number(offsetX);
    if (!isNaN(pixels)) {
      userOptions.left = `${pixels}px`;
    }
  }

  // offsetX: position in pixels
  // Should be a number 0 - 1920
  const offsetY = searchParams.get('offsety');
  if (offsetY) {
    const pixels = Number(offsetY);
    if (!isNaN(pixels)) {
      userOptions.top = `${pixels}px`;
    }
  }

  const hideNav = searchParams.get('hidenav');
  if (hideNav) {
    userOptions.hideNav = hideNav;
  }

  const hideOvertime = searchParams.get('hideovertime');
  if (hideOvertime) {
    userOptions.hideOvertime = hideOvertime;
  }

  const hideMessagesOverlay = searchParams.get('hidemessages');
  if (hideMessagesOverlay) {
    userOptions.hideMessagesOverlay = hideMessagesOverlay;
  }

  const showOverlay = pres.text !== '' && pres.visible;
  const isPlaying = time.playstate !== 'pause';
  const timer = formatDisplay(time.running, true);
  const clean = timer.replace('/:/g', '');
  const showFinished = time.isNegative && !userOptions?.hideOvertime;

  return (
    <div
      className={showFinished ? 'minimal-timer minimal-timer--finished' : 'minimal-timer'}
      style={{
        backgroundColor: userOptions.keyColour,
        color: userOptions.textColour,
        justifyContent: userOptions.justifyContent,
        alignItems: userOptions.alignItems,
      }}
      data-testid='minimal-timer'
    >
      {!hideMessagesOverlay && (
        <div
          className={showOverlay ? 'message-overlay message-overlay--active' : 'message-overlay'}
        >
          <div className='message'>{pres.text}</div>
        </div>
      )}
      {!userOptions?.hideNav && <NavLogo />}
      <div
        className={`timer ${!isPlaying ? 'timer--paused' : ''} ${
          showFinished ? 'timer--finished' : ''
        }`}
        style={{
          fontSize: `${(89 / (clean.length - 1)) * userOptions.size}vw`,
          fontFamily: userOptions.font,
          top: userOptions.top,
          left: userOptions.left,
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
  viewSettings: PropTypes.object,
};
