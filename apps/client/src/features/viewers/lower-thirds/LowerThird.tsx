import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CustomFields, OntimeEvent, ViewSettings } from 'ontime-types';
import { isPlaybackActive, MILLIS_PER_SECOND } from 'ontime-utils';

import { overrideStylesURL } from '../../../common/api/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { getPropertyValue } from '../common/viewUtils';

import { getLowerThirdOptions, useLowerOptions } from './lowerThird.options';

import './LowerThird.scss';

interface LowerProps {
  customFields: CustomFields;
  eventNow: OntimeEvent | null;
  viewSettings: ViewSettings;
  time: ViewExtendedTimer;
}

export default function LowerThird(props: LowerProps) {
  const { customFields, eventNow, viewSettings, time } = props;
  const previousId = useRef<string>();
  const animationTimeout = useRef<NodeJS.Timeout>();
  const [playState, setPlayState] = useState<boolean>(false);
  const [textValue, setTextValue] = useState<{ top: string; bottom: string }>({ top: '', bottom: '' });
  useRuntimeStylesheet(viewSettings?.overrideStyles ? overrideStylesURL : undefined);
  const options = useLowerOptions();
  const { playback } = time;

  useWindowTitle('Lower Third');

  // on unmount, cancel any ongoing animations
  useEffect(() => {
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
  }, [eventNow, options.bottomSrc, options.hold, options.topSrc]);

  const animateIn = useCallback(() => {
    // if hold skip
    if (options.hold < 0) return;

    //clear any pending timeouts
    clearTimeout(animationTimeout.current);
    // set the values
    setTextValue({
      top: getPropertyValue(eventNow, options.topSrc) ?? '',
      bottom: getPropertyValue(eventNow, options.bottomSrc) ?? '',
    });
    // start animation
    setPlayState(true);
    // reschedule out animation, should animate out after the in animation time + hold time
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
      if (eventNow?.id) animateIn();
    }
  }, [animateIn, eventNow?.id]);

  const boxDuration = playState ? `${options.transitionIn * 0.5}s` : `${options.transitionOut * 0.5}s`;
  const boxDelay = playState ? `${options.delay}s` : `${options.transitionOut * 0.5}s`;

  const textDuration = playState ? `${options.transitionIn * 0.5}s` : `${options.transitionOut * 0.5}s`;
  const textDelay = playState ? `${options.delay + options.transitionIn * 0.5}s` : '0s';

  // gather option data
  const lowerThirdOptions = useMemo(() => getLowerThirdOptions(customFields), [customFields]);

  return (
    <div className='lower-third' style={{ backgroundColor: `#${options.key}` }}>
      <ViewParamsEditor viewOptions={lowerThirdOptions} />
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
              fontSize: `${options.topSize}em`,
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
              fontSize: `${options.bottomSize}em`,
            }}
          >
            {textValue.bottom}
          </div>
        </div>
      </div>
    </div>
  );
}
