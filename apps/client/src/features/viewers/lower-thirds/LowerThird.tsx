import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomFields, OntimeEvent, ViewSettings } from 'ontime-types';
import { isPlaybackActive, MILLIS_PER_SECOND } from 'ontime-utils';

import { overrideStylesURL } from '../../../common/api/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { usePlayback } from '../../../common/hooks/useSocket';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import urlNumber from '../../../common/utils/urlNumber';
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
  transitionIn: number;
  transitionOut: number;
  hold: number;
  delay: number;
  key: string;
  lineColour: string;
  lineHeight: string;
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
  transitionIn: 3,
  transitionOut: 3,
  hold: 3,
  delay: 0,
  key: 'FFF0',
  lineColour: 'FF0000',
  lineHeight: '0.4em',
};

export default function LowerThird(props: LowerProps) {
  const { customFields, eventNow, viewSettings } = props;
  const [searchParams] = useSearchParams();
  const previousId = useRef<string>();
  const animationTimeout = useRef<NodeJS.Timeout>();
  const [playState, setPlayState] = useState<boolean>(false);
  const [textValue, setTextValue] = useState<{ top: string; bottom: string }>({ top: '', bottom: '' });
  useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const { playback } = usePlayback();

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

    newOptions.transitionIn = urlNumber(searchParams.get('transition-in'), newOptions.transitionIn);
    newOptions.transitionOut = urlNumber(searchParams.get('transition-out'), newOptions.transitionOut);
    newOptions.hold = urlNumber(searchParams.get('hold'), newOptions.hold);
    newOptions.delay = urlNumber(searchParams.get('hold'), newOptions.delay);

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

  // on unmount, cancel any ongoing animations
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      clearTimeout(animationTimeout.current);
    };
  }, []);

  const animateIn = useCallback(() => {
    // if hold is negative then force animate in
    if (options.hold < 0) {
      clearTimeout(animationTimeout.current);
      setTextValue({
        top: getPropertyValue(eventNow, options.topSrc) ?? '',
        bottom: getPropertyValue(eventNow, options.bottomSrc) ?? '',
      });
      setPlayState(true);
      return;
    }
    //clear any pending timeouts
    clearTimeout(animationTimeout.current);
    // set the values
    setTextValue({
      top: getPropertyValue(eventNow, options.topSrc) ?? '',
      bottom: getPropertyValue(eventNow, options.bottomSrc) ?? '',
    });
    // start animation
    setPlayState(true);
    // reschedule out animatnion, should animate out after the in animatnion time + holde time
    setTimeout(() => setPlayState(false), (options.hold + options.transitionIn) * MILLIS_PER_SECOND);
  }, [eventNow, options.bottomSrc, options.hold, options.topSrc, options.transitionIn]);

  const animateOut = useCallback(() => {
    if (options.hold < 0) return; // if hold is negative then we never animate out
    //clear any pending timeouts
    clearTimeout(animationTimeout.current);
    // start animation
    setPlayState(false);
  }, [options.hold]);

  // check if playback has changed and schedule animations
  useEffect(() => {
    if (isPlaybackActive(playback)) {
      animateIn();
    } else {
      animateOut();
    }
  }, [animateIn, animateOut, playback]);

  // check if data has changed and schedule animations
  useEffect(() => {
    const hasChanged = eventNow?.id !== previousId.current;
    if (hasChanged) {
      previousId.current = eventNow?.id;
      animateIn();
    }
  }, [animateIn, eventNow?.id]);

  const boxDuration = playState ? `${options.transitionIn}s` : `${options.transitionOut}s`;
  const boxDelay = playState ? `${options.delay}s` : '0s';

  // the in animation of the text is starts 1/4 after the box animation and compleats 1/4 before the box
  // the out animation follows the box but cmpleats 1/4 before the box
  const textDuration = playState ? `${options.transitionIn * 0.5}s` : `${options.transitionOut * 0.75}s`;
  const textDelay = playState ? `${options.delay + options.transitionIn * 0.25}s` : '0s';

  return (
    <div className='lower-third' style={{ backgroundColor: `#${options.key}` }}>
      <ViewParamsEditor viewOptions={getLowerThirdOptions(customFields)} />
      <div
        className={`container ${playState ? 'container--in' : 'container--out'}`}
        style={{
          minWidth: `${options.width}vw`,
          transitionDuration: boxDuration,
          transitionDelay: boxDelay,
        }}
      >
        <div className='clip'>
          <div
            className='data-top'
            style={{
              transitionDuration: textDuration,
              transitionDelay: textDelay,
              color: `#${options.topColour}`,
              backgroundColor: `#${options.topBg}`,
              fontSize: options.topSize,
            }}
          >
            {textValue.top}
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
              transitionDuration: textDuration,
              transitionDelay: textDelay,
              color: `#${options.bottomColour}`,
              backgroundColor: `#${options.bottomBg}`,
              fontSize: options.bottomSize,
            }}
          >
            {textValue.bottom}
          </div>
        </div>
      </div>
    </div>
  );
}
