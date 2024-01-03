import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Message, OntimeEvent } from 'ontime-types';

import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import { LOWER_THIRD_OPTIONS } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';

import './LowerThrid.scss';

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
  upperSize: number;
  lowerSize: number;
  transition: number;
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
    upperSize: 4,
    lowerSize: 3,
    transition: 3,
  });

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

  const _upperSize = searchParams.get('upper-colour');
  if (_upperSize) {
    const upperSize = Number(_upperSize);
    if (!Number.isNaN(upperSize) && upperSize != options.upperSize) {
      setOptions({ ...options, upperSize });
    }
  }

  const _lowerSize = searchParams.get('upper-colour');
  if (_lowerSize) {
    const lowerSize = Number(_lowerSize);
    if (!Number.isNaN(lowerSize) && lowerSize != options.lowerSize) {
      setOptions({ ...options, lowerSize });
    }
  }

  const _transition = searchParams.get('transition');
  if (_transition) {
    const transition = Number(_transition);
    if (!Number.isNaN(transition) && transition != options.transition) {
      setOptions({ ...options, transition });
    }
  }

  const upperSrcText = options.upperSrc == srcKeys.lower ? lower.text : eventNow ? eventNow[options.upperSrc] : '';
  const upperText = upperSrcText.trim() == '' ? <div>&nbsp;</div> : upperSrcText;

  const lowerSrcText = options.lowerSrc == srcKeys.lower ? lower.text : eventNow ? eventNow[options.lowerSrc] : '';
  const lowerText = lowerSrcText.trim() == '' ? <div>&nbsp;</div> : lowerSrcText;

  const transition = `${options.transition}s`;

  return (
    <div className='lower-third' style={{ backgroundColor: '#ffff' }}>
      <NavigationMenu />
      <ViewParamsEditor paramFields={LOWER_THIRD_OPTIONS} />
      <div className='container' style={{ width: `${options.width}vw`, animationDuration: transition }}>
        <div className='clip'>
          <div
            className='data-upper'
            style={{
              animationDuration: transition,
              color: `#${options.upperColour}`,
              fontSize: `${options.upperSize}vh`,
            }}
          >
            {upperText}
          </div>
        </div>
        <div className='line'></div>
        <div className='clip'>
          <div
            className='data-lower'
            style={{
              animationDuration: transition,
              color: `#${options.lowerColour}`,
              fontSize: `${options.lowerSize}vh`,
            }}
          >
            {lowerText}
          </div>
        </div>
      </div>
    </div>
  );
}
