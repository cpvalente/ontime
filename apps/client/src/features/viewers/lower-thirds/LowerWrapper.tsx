import { memo, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import { useSearchParams } from 'react-router-dom';
import { Message, OntimeEvent, ViewSettings } from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';

import LowerLines from './LowerLines';

export type LowerOptions = {
  size: number;
  transitionIn: number;
  textColour: string;
  bgColour: string;
  keyColour?: string;
  fadeOut: number;
};

interface LowerProps {
  eventNow: OntimeEvent | null;
  lower: Message;
  viewSettings: ViewSettings;
}

// prevent triggering animation without a content change
const areEqual = (prevProps: LowerProps, nextProps: LowerProps) => {
  return isEqual(prevProps.eventNow?.title, nextProps.eventNow?.title) && isEqual(prevProps.lower, nextProps.lower);
};

const Lower = (props: LowerProps) => {
  const { eventNow, lower, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [searchParams] = useSearchParams();

  const [heading, setHeading] = useState('');
  const [subheading, setSubheading] = useState('');
  const [showLower, setShowLower] = useState(false);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Lower Thirds';
  }, []);

  // reload if data changes
  useEffect(() => {
    // clear titles if necessary
    // will trigger an animation out in the component
    let timeout: NodeJS.Timeout;

    const haveTitlesChanged = eventNow?.title !== heading || eventNow?.presenter !== subheading;
    const areTitlesEmpty = !eventNow?.title && !eventNow?.presenter;

    // we have new titles
    if (haveTitlesChanged && !areTitlesEmpty) {
      // show lower
      setHeading(eventNow?.title ?? '');
      setSubheading(eventNow?.presenter ?? '');
      setShowLower(true);

      // schedule transition out
      const transitionTime = 5000;
      timeout = setTimeout(() => {
        setShowLower(false);
      }, transitionTime);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
    // eslint-disable-next-line -- we do this to keep animations
  }, [eventNow?.title, eventNow?.presenter]);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  const options: LowerOptions = {
    size: 1,
    transitionIn: 3,
    textColour: '#fffffa',
    bgColour: '#00000033',
    fadeOut: 3,
  };

  // size: multiplier
  // Should be a number 0.0-n
  const _size = searchParams.get('size');
  if (_size) {
    const parsedValue = Number(_size);
    if (!Number.isNaN(parsedValue)) {
      options.size = parsedValue;
    }
  }

  // transitionIn: seconds
  // Should be a number 0-n
  const _transitionIn = searchParams.get('transition');
  if (_transitionIn) {
    const parsedValue = Number(_transitionIn);
    if (!Number.isNaN(parsedValue)) {
      options.transitionIn = parsedValue;
    }
  }

  // textColour: string
  // Should be a hex string '#ffffff'
  const _textColour = searchParams.get('text');
  if (_textColour) options.textColour = `#${_textColour}`;

  // bgColour: string
  // Should be a hex string '#ffffff'
  const _bgColour = searchParams.get('bg');
  if (_bgColour) options.bgColour = `#${_bgColour}`;

  // key: string
  // Should be a hex string '#00FF00' with key colour
  const _key = searchParams.get('key');
  if (_key) options.keyColour = `#${_key}`;

  // fadeOut: seconds
  // Should be a number 0-n
  const _fadeOut = searchParams.get('fadeout');
  if (_fadeOut) {
    const parsedValue = Number(_transitionIn);
    if (!Number.isNaN(parsedValue)) {
      options.fadeOut = parsedValue;
    }
  }

  return <LowerLines lower={lower} heading={heading} subheading={subheading} options={options} doShow={showLower} />;
};

export default memo(Lower, areEqual);
