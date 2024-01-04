import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Message, OntimeEvent, ViewSettings } from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import { LOWER_THIRD_OPTIONS } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { cx } from '../../../common/utils/styleUtils';

import './LowerThird.scss';

enum srcKeys {
  Title = 'title',
  Subtitle = 'subtitle',
  Presenter = 'presenter',
  LowerMsg = 'lowerMsg',
}

enum triggerType {
  Event = 'event',
  Manual = 'manual',
}

type LowerOptions = {
  width: number;
  trigger: triggerType;
  topSrc: srcKeys;
  bottomSrc: srcKeys;
  topColour: string;
  bottomColour: string;
  topBg: string;
  bottomBg: string;
  topSize: string;
  bottomSize: string;
  transition: number;
  delay: number;
  key: string;
  lineColour: string;
  lineHeight: string;
};

interface LowerProps {
  eventNow: OntimeEvent | null;
  viewSettings: ViewSettings;
  lower: Message;
}

const defaultOptions: LowerOptions = {
  width: 45,
  trigger: triggerType.Event,
  topSrc: srcKeys.Title,
  bottomSrc: srcKeys.Subtitle,
  topColour: '000000ff',
  bottomColour: '000000ff',
  topBg: '00000000',
  bottomBg: '00000000',
  topSize: '65px',
  bottomSize: '40px',
  transition: 3,
  delay: 3,
  key: 'ffffffff',
  lineColour: 'ff0000ff',
  lineHeight: '0.4em',
};

export default function LowerThird(props: LowerProps) {
  const { eventNow, lower, viewSettings } = props;
  const [searchParams] = useSearchParams();

  const options = useMemo(() => {
    const newOptions = { ...defaultOptions };

    const _width = searchParams.get('width');
    if (_width) {
      const width = Number(_width);
      if (!Number.isNaN(width) && width != newOptions.width) {
        newOptions.width = width;
      }
    }

    const trigger = searchParams.get('trigger') as triggerType;
    if (trigger && Object.values(triggerType).includes(trigger) && trigger != newOptions.trigger) {
      newOptions.trigger = trigger;
    }

    const _topSrc = searchParams.get('top-src');
    if (_topSrc && _topSrc in srcKeys && _topSrc != newOptions.topSrc) {
      const topSrc = _topSrc as srcKeys;
      newOptions.topSrc = topSrc;
    }

    const _bottomSrc = searchParams.get('bottom-src');
    if (_bottomSrc && _bottomSrc in srcKeys && _bottomSrc != newOptions.bottomSrc) {
      const bottomSrc = _bottomSrc as srcKeys;
      newOptions.bottomSrc = bottomSrc;
    }

    const topColour = searchParams.get('top-colour');
    if (topColour && topColour != newOptions.topColour) {
      newOptions.topColour = topColour;
    }

    const bottomColour = searchParams.get('bottom-colour');
    if (bottomColour && bottomColour != newOptions.bottomColour) {
      newOptions.bottomColour = bottomColour;
    }

    const topBg = searchParams.get('top-bg');
    if (topBg && topBg != newOptions.topBg) {
      newOptions.topBg = topBg;
    }

    const bottomBg = searchParams.get('bottom-bg');
    if (bottomBg && bottomBg != newOptions.bottomBg) {
      newOptions.bottomBg = bottomBg;
    }

    const topSize = searchParams.get('top-size');
    if (topSize && topSize != newOptions.topSize) {
      newOptions.topSize = topSize;
    }

    const bottomSize = searchParams.get('bottom-size');
    if (bottomSize && bottomSize != newOptions.bottomSize) {
      newOptions.bottomSize = bottomSize;
    }

    const _transition = searchParams.get('transition');
    if (_transition) {
      const transition = Number(_transition);
      if (!Number.isNaN(transition) && transition != newOptions.transition) {
        newOptions.transition = transition;
      }
    }

    const _delay = searchParams.get('delay');
    if (_delay) {
      const delay = Number(_delay);
      if (!Number.isNaN(delay) && delay != newOptions.delay) {
        newOptions.delay = delay;
      }
    }

    const key = searchParams.get('key');
    if (key && key != newOptions.key) {
      newOptions.key = key;
    }

    const lineColour = searchParams.get('line-colour');
    if (lineColour && lineColour != newOptions.lineColour) {
      newOptions.lineColour = lineColour;
    }
    return newOptions;
  }, [searchParams]);

  useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);

  const [playState, setplayState] = useState<'pre' | 'in' | 'out'>('pre');

  useEffect(() => {
    document.title = 'ontime - Lower Third';
  }, []);

  const topText = options.topSrc == srcKeys.LowerMsg ? lower.text : eventNow ? eventNow[options.topSrc] : '';

  const bottomText = options.bottomSrc == srcKeys.LowerMsg ? lower.text : eventNow ? eventNow[options.bottomSrc] : '';

  const transition = `${options.transition}s`;

  const triggerData =
    options.trigger == triggerType.Event ? eventNow?.id : options.trigger == triggerType.Manual ? lower.visible : null;

  useEffect(() => {
    if (options.trigger == triggerType.Event) {
      if (triggerData) {
        setplayState('in');
        const timeout = setTimeout(
          () => {
            setplayState('out');
          },
          options.delay * 1000 + options.transition * 1000,
        );
        return () => clearTimeout(timeout);
      } else {
        setplayState('pre');
      }
    } else if (options.trigger == triggerType.Manual) {
      if (triggerData) {
        setplayState('in');
      } else {
        setplayState('out');
      }
    }
    return () => null;
  }, [options.delay, options.trigger, triggerData]);

  return (
    <div className='lower-third' style={{ backgroundColor: `#${options.key}` }}>
      <NavigationMenu />
      <ViewParamsEditor paramFields={LOWER_THIRD_OPTIONS} />
      <div
        className={cx(['container', `container--${playState}`])}
        style={{ minWidth: `${options.width}vw`, animationDuration: transition }}
      >
        <div className='clip'>
          <div
            className='data-top'
            style={{
              animationDuration: transition,
              color: `#${options.topColour}`,
              backgroundColor: `#${options.topBg}`,
              fontSize: options.topSize,
            }}
          >
            {topText}
          </div>
        </div>
        <div
          className='line'
          style={{
            backgroundColor: `#${options.lineColour}`,
          }}
        />
        <div className='clip'>
          <div
            className='data-bottom'
            style={{
              animationDuration: transition,
              color: `#${options.bottomColour}`,
              backgroundColor: `#${options.bottomBg}`,
              fontSize: options.bottomSize,
            }}
          >
            {bottomText}
          </div>
        </div>
      </div>
    </div>
  );
}
