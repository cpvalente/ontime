import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Message, OntimeEvent } from 'ontime-types';

import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import { LOWER_THIRD_OPTIONS } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { cx } from '../../../common/utils/styleUtils';

import './LowerThrid.scss';

//TODO: add none option
enum srcKeys {
  title = 'title',
  subtitle = 'subtitle',
  presenter = 'presenter',
  notes = 'note',
  lower = 'lower',
}

type LowerOptions = {
  width: number;
  upperSrc: srcKeys;
  lowerSrc: srcKeys;
  upperColour: string;
  lowerColour: string;
  upperBg: string;
  lowerBg: string;
  upperFont: string;
  lowerFont: string;
  transition: number;
  delay: number;
  key: string;
  lineColour: string;
  lineHeight: string;
};

interface LowerProps {
  eventNow: OntimeEvent | null;
  lower: Message;
}

export default function LowerThird(props: LowerProps) {
  const { eventNow, lower } = props;
  const [searchParams] = useSearchParams();
  const [options, setOptions] = useState<LowerOptions>({
    width: 45,
    upperSrc: srcKeys.title,
    lowerSrc: srcKeys.subtitle,
    upperColour: '000000ff',
    lowerColour: '000000ff',
    upperBg: 'dddddd44',
    lowerBg: 'dddddd44',
    upperFont: 'bold 4vh sans-serif',
    lowerFont: 'normal 3.5vh sans-serif',
    transition: 3,
    delay: 3,
    key: '00000000',
    lineColour: 'ff0000ff',
    lineHeight: '0.4em',
  });

  const [playState, setplayState] = useState<'pre' | 'in' | 'out'>('pre');

  useEffect(() => {
    document.title = 'ontime - Lower3';
  }, []);

  const _width = searchParams.get('width');
  if (_width) {
    const width = Number(_width);
    if (!Number.isNaN(width) && width != options.width) {
      setOptions({ ...options, width });
    }
  }

  const _upperSrc = searchParams.get('upper-src');
  if (_upperSrc && _upperSrc in srcKeys && _upperSrc != options.upperSrc) {
    const upperSrc = _upperSrc as srcKeys;
    setOptions({ ...options, upperSrc });
  }

  const _lowerSrc = searchParams.get('lower-src');
  if (_lowerSrc && _lowerSrc in srcKeys && _lowerSrc != options.lowerSrc) {
    const lowerSrc = _lowerSrc as srcKeys;
    setOptions({ ...options, lowerSrc });
  }

  const upperColour = searchParams.get('upper-colour');
  if (upperColour && upperColour != options.upperColour) {
    setOptions({ ...options, upperColour });
  }

  const lowerColour = searchParams.get('lower-colour');
  if (lowerColour && lowerColour != options.lowerColour) {
    setOptions({ ...options, lowerColour });
  }

  const upperBg = searchParams.get('upper-bg');
  if (upperBg && upperBg != options.upperBg) {
    setOptions({ ...options, upperBg });
  }

  const lowerBg = searchParams.get('lower-bg');
  if (lowerBg && lowerBg != options.lowerBg) {
    setOptions({ ...options, lowerBg });
  }

  const upperFont = searchParams.get('upper-font');
  if (upperFont && upperFont != options.upperFont) {
    setOptions({ ...options, upperFont });
  }

  const lowerFont = searchParams.get('lower-font');
  if (lowerFont && lowerFont != options.lowerFont) {
    setOptions({ ...options, lowerFont });
  }

  const _transition = searchParams.get('transition');
  if (_transition) {
    const transition = Number(_transition);
    if (!Number.isNaN(transition) && transition != options.transition) {
      setOptions({ ...options, transition });
    }
  }

  const _delay = searchParams.get('delay');
  if (_delay) {
    const delay = Number(_delay);
    if (!Number.isNaN(delay) && delay != options.delay) {
      setOptions({ ...options, delay });
    }
  }

  const key = searchParams.get('key');
  if (key && key != options.key) {
    setOptions({ ...options, key });
  }

  const lineColour = searchParams.get('line-colour');
  if (lineColour && lineColour != options.lineColour) {
    setOptions({ ...options, lineColour });
  }

  const lineHeight = searchParams.get('line-height');
  if (lineHeight && lineHeight != options.lineHeight) {
    setOptions({ ...options, lineHeight });
  }

  const upperSrcText = options.upperSrc == srcKeys.lower ? lower.text : eventNow ? eventNow[options.upperSrc] : '';
  const upperText = upperSrcText.trim() == '' ? <div>&nbsp;</div> : upperSrcText;

  const lowerSrcText = options.lowerSrc == srcKeys.lower ? lower.text : eventNow ? eventNow[options.lowerSrc] : '';
  const lowerText = lowerSrcText.trim() == '' ? <div>&nbsp;</div> : lowerSrcText;

  const transition = `${options.transition}s`;

  const trigger = eventNow?.id;

  useEffect(() => {
    if (trigger) {
      setplayState('in');
      const timeout = setTimeout(() => {
        setplayState('out');
      }, options.delay * 1000);
      return () => clearTimeout(timeout);
    } else {
      setplayState('pre');
    }
  }, [options.delay, trigger]);

  return (
    <div className='lower-third' style={{ backgroundColor: `#${options.key}` }}>
      <NavigationMenu />
      <ViewParamsEditor paramFields={LOWER_THIRD_OPTIONS} />
      <div
        className={cx(['container', `container--${playState}`])}
        style={{ width: `${options.width}vw`, animationDuration: transition }}
      >
        <div className='clip'>
          <div
            className='data-upper'
            style={{
              animationDuration: transition,
              color: `#${options.upperColour}`,
              backgroundColor: `#${options.upperBg}`,
              font: options.upperFont,
            }}
          >
            {upperText}
          </div>
        </div>
        <div
          className='line'
          style={{
            backgroundColor: `#${options.lineColour}`,
            height: options.lineHeight,
          }}
        />
        <div className='clip'>
          <div
            className='data-lower'
            style={{
              animationDuration: transition,
              color: `#${options.lowerColour}`,
              backgroundColor: `#${options.lowerBg}`,
              font: options.lowerFont,
            }}
          >
            {lowerText}
          </div>
        </div>
      </div>
    </div>
  );
}
