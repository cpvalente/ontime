import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Message, OntimeEvent, ViewSettings } from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import { LOWER_THIRD_OPTIONS } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';

import './LowerThird.scss';

enum SrcKeys {
  Title = 'title',
  Subtitle = 'subtitle',
  Presenter = 'presenter',
  LowerMsg = 'lowerMsg',
}

enum TriggerType {
  Event = 'event',
  Manual = 'manual',
}

type LowerOptions = {
  width: number;
  trigger: TriggerType;
  topSrc: SrcKeys;
  bottomSrc: SrcKeys;
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

const defaultOptions: Readonly<LowerOptions> = {
  width: 45,
  trigger: TriggerType.Event,
  topSrc: SrcKeys.Title,
  bottomSrc: SrcKeys.Subtitle,
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

    const width = searchParams.get('width');
    if (width !== null) {
      newOptions.width = Number(width);
    }

    const trigger = Object.values(TriggerType).find((s) => s === searchParams.get('trigger'));
    if (trigger) {
      newOptions.trigger = trigger;
    }

    const topSrc = Object.values(SrcKeys).find((s) => s === searchParams.get('top-src'));
    if (topSrc) {
      newOptions.topSrc = topSrc;
    }

    const bottomSrc = Object.values(SrcKeys).find((s) => s === searchParams.get('bottom-src'));
    if (bottomSrc) {
      newOptions.bottomSrc = bottomSrc;
    }

    const topColour = searchParams.get('top-colour');
    if (topColour !== null) {
      newOptions.topColour = topColour;
    }

    const bottomColour = searchParams.get('bottom-colour');
    if (bottomColour !== null) {
      newOptions.bottomColour = bottomColour;
    }

    const topBg = searchParams.get('top-bg');
    if (topBg !== null) {
      newOptions.topBg = topBg;
    }

    const bottomBg = searchParams.get('bottom-bg');
    if (bottomBg !== null) {
      newOptions.bottomBg = bottomBg;
    }

    const topSize = searchParams.get('top-size');
    if (topSize !== null) {
      newOptions.topSize = topSize;
    }

    const bottomSize = searchParams.get('bottom-size');
    if (bottomSize && bottomSize != newOptions.bottomSize) {
      newOptions.bottomSize = bottomSize;
    }

    const transition = searchParams.get('transition');
    if (transition !== null) {
      newOptions.transition = Number(transition);
    }

    const delay = searchParams.get('delay');
    if (delay !== null) {
      newOptions.delay = Number(delay);
    }

    const key = searchParams.get('key');
    if (key !== null) {
      newOptions.key = key;
    }

    const lineColour = searchParams.get('line-colour');
    if (lineColour !== null) {
      newOptions.lineColour = lineColour;
    }

    return newOptions;
  }, [searchParams]);

  useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);

  const [playState, setPlayState] = useState<'pre' | 'in' | 'out'>('pre');

  useEffect(() => {
    document.title = 'ontime - Lower Third';
  }, []);

  const topText = useMemo(() => {
    if (options.topSrc === SrcKeys.LowerMsg) {
      return lower.text;
    } else if (eventNow) {
      return eventNow[options.topSrc];
    }
    return '';
  }, [eventNow, lower.text, options]);

  const bottomText = useMemo(() => {
    if (options.bottomSrc === SrcKeys.LowerMsg) {
      return lower.text;
    } else if (eventNow) {
      return eventNow[options.bottomSrc];
    }
    return '';
  }, [eventNow, lower.text, options]);

  const transition = `${options.transition}s`;

  const trigger = useMemo(() => {
    if (options.trigger === TriggerType.Event) {
      return eventNow?.id;
    } else if (options.trigger === TriggerType.Manual) {
      return lower.visible;
    }
    return false;
  }, [eventNow?.id, lower.visible, options.trigger]);

  useEffect(() => {
    if (options.trigger === TriggerType.Event && trigger) {
      setPlayState('in');
      const animateOutInMs = options.delay * 1000 + options.transition * 1000;
      const timeout = setTimeout(() => {
        setPlayState('out');
      }, animateOutInMs);
      return () => clearTimeout(timeout);
    } else if (options.trigger === TriggerType.Manual) {
      setPlayState(trigger ? 'in' : 'out');
    } else {
      setPlayState('pre');
    }
    return () => null;
  }, [options.delay, options.transition, options.trigger, trigger]);

  return (
    <div className='lower-third' style={{ backgroundColor: `#${options.key}` }}>
      <NavigationMenu />
      <ViewParamsEditor paramFields={LOWER_THIRD_OPTIONS} />
      <div
        className={`container container--${playState}`}
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
