import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EventData, Message, Playback, TimerType, ViewSettings } from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { TimeManagerType } from '../../../common/models/TimeManager.type';
import { OverridableOptions } from '../../../common/models/View.types';
import { isStringBoolean } from '../../../common/utils/viewUtils';
import { formatTimerDisplay, getTimerByType } from '../common/viewerUtils';

import './MinimalTimer.scss';

interface MinimalTimerProps {
  isMirrored: boolean;
  pres: Message;
  time: TimeManagerType;
  viewSettings: ViewSettings;
  general: EventData;
}

export default function MinimalTimer(props: MinimalTimerProps) {
  const { isMirrored, pres, time, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'ontime - Minimal Timer';
  }, []);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  // get config from url: key, text, font, size, hideovertime
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
  userOptions.hideOvertime = isStringBoolean(hideOvertime);

  const hideMessagesOverlay = searchParams.get('hidemessages');
  userOptions.hideMessagesOverlay = isStringBoolean(hideMessagesOverlay);

  const hideEndMessage = searchParams.get('hideendmessage');
  userOptions.hideEndMessage = isStringBoolean(hideEndMessage);

  const showOverlay = pres.text !== '' && pres.visible;
  const isPlaying = time.playback !== Playback.Pause;
  const isNegative =
    (time.current ?? 0) < 0 && time.timerType !== TimerType.Clock && time.timerType !== TimerType.CountUp;
  const showEndMessage = (time.current ?? 0) < 0 && viewSettings.endMessage && !hideEndMessage;
  const finished = time.playback === Playback.Play && (time.current ?? 0) < 0 && time.startedAt;
  const showFinished = finished && !userOptions?.hideOvertime && (time.timerType !== TimerType.Clock || showEndMessage);

  const showProgress = time.playback !== Playback.Stop;
  const showWarning = (time.current ?? 1) < viewSettings.warningThreshold;
  const showDanger = (time.current ?? 1) < viewSettings.dangerThreshold;
  const timerColor = userOptions.textColour
    ? userOptions.textColour
    : showProgress && showDanger
    ? viewSettings.dangerColor
    : showProgress && showWarning
    ? viewSettings.warningColor
    : viewSettings.normalColor;

  const stageTimer = getTimerByType(time);
  let display = formatTimerDisplay(stageTimer);
  if (isNegative) {
    display = `-${display}`;
  }
  const stageTimerCharacters = display.replace('/:/g', '').length;

  const timerFontSize = (89 / (stageTimerCharacters - 1)) * (userOptions.size || 1);

  const timerClasses = `timer ${!isPlaying ? 'timer--paused' : ''} ${showFinished ? 'timer--finished' : ''}`;
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
        <div className={showOverlay ? 'message-overlay message-overlay--active' : 'message-overlay'}>
          <div className='message'>{pres.text}</div>
        </div>
      )}
      {showEndMessage ? (
        <div className='end-message'>{viewSettings.endMessage}</div>
      ) : (
        <div
          className={timerClasses}
          style={{
            color: timerColor,
            fontSize: `${timerFontSize}vw`,
            fontFamily: userOptions.font,
            top: userOptions.top,
            left: userOptions.left,
            backgroundColor: userOptions.textBackground,
          }}
        >
          {display}
        </div>
      )}
    </div>
  );
}
