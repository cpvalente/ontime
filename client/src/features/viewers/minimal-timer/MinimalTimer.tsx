import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtom } from 'jotai';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import { mirrorViewersAtom } from '../../../common/atoms/ViewerSettings';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { PresenterMessageType } from '../../../common/models/PresenterMessage.type';
import { TimeManagerType } from '../../../common/models/TimeManager.type';
import { ViewSettingsType } from '../../../common/models/ViewSettings.type';
import { OverridableOptions } from '../../../common/models/ViewTypes';
import { formatDisplay } from '../../../common/utils/dateConfig';

import './MinimalTimer.scss';

interface MinimalTimerProps {
  pres: PresenterMessageType;
  time: TimeManagerType;
  viewSettings: ViewSettingsType;
}

export default function MinimalTimer(props: MinimalTimerProps) {
  const { pres, time, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [searchParams] = useSearchParams();
  const [isMirrored] = useAtom(mirrorViewersAtom);

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
  const userOptions: OverridableOptions = {
    size: 1,
  };

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

  // textBackground: string
  // Should be a hex string '#ffffff'
  const textBackground = searchParams.get('textbg');
  if (textBackground) {
    userOptions.textBackground = `#${textBackground}`;
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
  if (size !== null && typeof size !== 'undefined') {
    if (!Number.isNaN(Number(size))) {
      userOptions.size = Number(size);
    }
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

  const hideOvertime = searchParams.get('hideovertime');
  userOptions.hideOvertime = Boolean(hideOvertime);

  const hideMessagesOverlay = searchParams.get('hidemessages');
  userOptions.hideMessagesOverlay = Boolean(hideMessagesOverlay);

  const showOverlay = pres.text !== '' && pres.visible;
  const isPlaying = time.playback !== 'pause';
  const timer = formatDisplay(time.running, true);
  const clean = timer.replace('/:/g', '');
  const showFinished = time.isNegative && !userOptions?.hideOvertime;

  const baseClasses = `minimal-timer ${isMirrored ? 'mirror' : ''}`;

  return (
    <div
      className={showFinished ? `${baseClasses} minimal-timer--finished` : baseClasses}
      style={{
        backgroundColor: userOptions.keyColour,
        justifyContent: userOptions.justifyContent,
        alignItems: userOptions.alignItems,
      }}
      data-testid='minimal-timer'
    >
      <NavigationMenu />
      {!hideMessagesOverlay && (
        <div
          className={showOverlay ? 'message-overlay message-overlay--active' : 'message-overlay'}
        >
          <div className='message'>{pres.text}</div>
        </div>
      )}
      <div
        className={`timer ${!isPlaying ? 'timer--paused' : ''} ${
          showFinished ? 'timer--finished' : ''
        }`}
        style={{
          color: userOptions.textColour,
          fontSize: `${(89 / (clean.length - 1)) * (userOptions.size || 1)}vw`,
          fontFamily: userOptions.font,
          top: userOptions.top,
          left: userOptions.left,
          backgroundColor: userOptions.textBackground,
        }}
      >
        {time.isNegative ? `-${timer}` : timer}
      </div>
    </div>
  );
}
