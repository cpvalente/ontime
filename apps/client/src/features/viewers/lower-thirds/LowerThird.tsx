import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomFields, OntimeEvent, ViewSettings } from 'ontime-types';
import { MILLIS_PER_SECOND } from 'ontime-utils';

import { overrideStylesURL } from '../../../common/api/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import { getPropertyValue } from '../common/viewUtils';

import { getLowerThirdOptions } from './lowerThird.options';

import './LowerThird.scss';

type LowerOptions = {
  width: number;
  topSrc: string;
  bottomSrc: string;
  topColour: string;
  bottomColour: string;
  topBg: string;
  bottomBg: string;
  topSize: string;
  bottomSize: string;
  transition: number;
  delay: number;
  wait: number;
  key: string;
  lineColour: string;
  lineHeight: string;
  trigger: string;
};

interface LowerProps {
  customFields: CustomFields;
  eventNow: OntimeEvent | null;
  viewSettings: ViewSettings;
}

const defaultOptions: Readonly<LowerOptions> = {
  width: 45,
  topSrc: 'title',
  bottomSrc: 'lowerMsg',
  topColour: '000000',
  bottomColour: '000000',
  topBg: 'FFF0',
  bottomBg: 'FFF0',
  topSize: '65px',
  bottomSize: '40px',
  transition: 3,
  delay: 0,
  wait: 3,
  key: 'FFF0',
  lineColour: 'FF0000',
  lineHeight: '0.4em',
  trigger: 'data',
};

export default function LowerThird(props: LowerProps) {
  const { customFields, eventNow, viewSettings } = props;
  const [searchParams] = useSearchParams();
  const previousId = useRef<string>();
  const animationTimeout = useRef<NodeJS.Timeout>();
  const [playState, setPlayState] = useState<'pre' | 'in' | 'out'>('pre');
  useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);

  useWindowTitle('Lower Third');

  const options = useMemo(() => {
    const newOptions = { ...defaultOptions };

    const width = searchParams.get('width');
    if (width !== null) {
      newOptions.width = Number(width);
    }

    const topSrc = searchParams.get('top-src');
    if (topSrc) {
      newOptions.topSrc = topSrc;
    }

    const bottomSrc = searchParams.get('bottom-src');
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

    const wait = searchParams.get('wait');
    if (wait !== null) {
      newOptions.wait = Number(wait);
    }

    const key = searchParams.get('key');
    if (key !== null) {
      newOptions.key = key;
    }

    const lineColour = searchParams.get('line-colour');
    if (lineColour !== null) {
      newOptions.lineColour = lineColour;
    }

    const trigger = searchParams.get('trigger');
    if (trigger !== null) {
      newOptions.trigger = trigger;
    }

    return newOptions;
  }, [searchParams]);

  // on unmount, cancel any ongoing animations
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      clearTimeout(animationTimeout.current);
    };
  }, []);

  // check if data has changed and schedule animations
  useEffect(() => {
    if (options.trigger === 'in') {
      setPlayState('in');
      return;
    }

    if (options.trigger === 'out') {
      setPlayState('out');
      return;
    }

    const hasChanged = eventNow?.id !== previousId.current;
    if (!hasChanged) {
      return;
    }

    previousId.current = eventNow?.id;
    clearTimeout(animationTimeout.current);

    if (eventNow === null) {
      if (playState === 'in') setPlayState('out');
      return;
    }

    animationTimeout.current = setTimeout(() => {
      setPlayState('in');
    }, options.delay * MILLIS_PER_SECOND);
  }, [eventNow, eventNow?.id, options.delay, options.transition, options.trigger, options.wait, playState, previousId]);

  useEffect(() => {
    clearTimeout(animationTimeout.current);
    if (playState === 'in') {
      const outDelayMs = (options.transition + options.wait) * MILLIS_PER_SECOND;
      animationTimeout.current = setTimeout(() => {
        setPlayState('out');
      }, outDelayMs);
      return;
    }
    if (playState === 'out') {
      const preDelayMs = options.transition * MILLIS_PER_SECOND;
      animationTimeout.current = setTimeout(() => {
        setPlayState('pre');
      }, preDelayMs);
      return;
    }
  }, [options.transition, options.wait, playState]);

  const topText = getPropertyValue(eventNow, options.topSrc) ?? '';
  const bottomText = getPropertyValue(eventNow, options.bottomSrc) ?? '';

  const transition = `${options.transition}s`;

  return (
    <div className='lower-third' style={{ backgroundColor: `#${options.key}` }}>
      <ViewParamsEditor viewOptions={getLowerThirdOptions(customFields)} />
      <div
        className={`container container--${playState}`}
        style={{ minWidth: `${options.width}vw`, animationDuration: transition }}
      >
        <div className='clip'>
          <div
            className='data-top'
            data-testid='l3-top'
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
            data-testid='l3-bottom'
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
