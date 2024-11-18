import { useSearchParams } from 'react-router-dom';
import { ProjectData, Settings } from 'ontime-types';

import ViewLogo from '../../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { OverridableOptions } from '../../../common/models/View.types';
import { formatTime, getDefaultFormat } from '../../../common/utils/time';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';

import { getClockOptions } from './clock.options';

import './Clock.scss';

interface ClockProps {
  general: ProjectData;
  isMirrored: boolean;
  time: ViewExtendedTimer;
  settings: Settings | undefined;
}

export default function Clock(props: ClockProps) {
  const { general, isMirrored, time, settings } = props;
  const [searchParams] = useSearchParams();

  useWindowTitle('Clock');

  // get config from url: key, text, font, size, hidenav
  // eg. http://localhost:3000/clock?key=f00&text=fff
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

  const clock = formatTime(time.clock);
  const clean = clock.replace('/:/g', '');

  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const clockOptions = getClockOptions(defaultFormat);

  return (
    <div
      className={`clock-view ${isMirrored ? 'mirror' : ''}`}
      style={{
        backgroundColor: userOptions.keyColour,
        justifyContent: userOptions.justifyContent,
        alignContent: userOptions.alignItems,
      }}
      data-testid='clock-view'
    >
      {general?.projectLogo && <ViewLogo name={general.projectLogo} className='logo' />}
      <ViewParamsEditor viewOptions={clockOptions} />
      <SuperscriptTime
        time={clock}
        className='clock'
        style={{
          color: userOptions.textColour,
          fontSize: `${(89 / (clean.length - 1)) * (userOptions.size || 1)}vw`,
          fontFamily: userOptions.font,
          top: userOptions.top,
          left: userOptions.left,
          backgroundColor: userOptions.textBackground,
        }}
      />
    </div>
  );
}
