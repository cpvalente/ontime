import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtom } from 'jotai';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import { mirrorViewersAtom } from '../../../common/atoms/ViewerSettings';
import NavLogo from '../../../common/components/nav/NavLogo';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { TimeManager, ViewSettings } from '../../../common/models/OntimeTypes';
import { OverridableOptions } from '../../../common/models/ViewTypes';
import { formatTime } from '../../../common/utils/time';

import './Clock.scss';

interface ClockProps {
  time: TimeManager;
  viewSettings: ViewSettings;
}

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

export default function Clock(props: ClockProps) {
  const { time, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [searchParams] = useSearchParams();
  const [isMirrored] = useAtom(mirrorViewersAtom);

  useEffect(() => {
    document.title = 'ontime - Clock';
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

  const hideNav = searchParams.get('hidenav');
  userOptions.hideNav = Boolean(hideNav);

  const clock = formatTime(time.clock, formatOptions);
  const clean = clock.replace('/:/g', '');

  return (
    <div
      className={`clock-view ${isMirrored ? 'mirror' : ''}`}
      style={{
        backgroundColor: userOptions.keyColour,
        color: userOptions.textColour,
        justifyContent: userOptions.justifyContent,
        alignItems: userOptions.alignItems,
      }}
      data-testid='clock-view'
    >
      {!userOptions?.hideNav && <NavLogo />}
      <div
        className='clock'
        style={{
          fontSize: `${(89 / (clean.length - 1)) * (userOptions.size || 1)}vw`,
          fontFamily: userOptions.font,
          top: userOptions.top,
          left: userOptions.left,
          backgroundColor: userOptions.textBackground,
        }}
      >
        {clock}
      </div>
    </div>
  );
}
