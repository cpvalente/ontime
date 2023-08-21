import { memo, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import { useSearchParams } from 'react-router-dom';
import { Message, ViewSettings } from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { TitleManager } from '../ViewWrapper';

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
  title: TitleManager;
  lower: Message;
  viewSettings: ViewSettings;
}

// prevent triggering animation without a content change
const areEqual = (prevProps: LowerProps, nextProps: LowerProps) => {
  return isEqual(prevProps.title, nextProps.title) && isEqual(prevProps.lower, nextProps.lower);
};

const Lower = (props: LowerProps) => {
  const { title, lower, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const [searchParams] = useSearchParams();
  const [titles, setTitles] = useState<TitleManager>({
    titleNow: '',
    titleNext: '',
    subtitleNow: '',
    subtitleNext: '',
    presenterNow: '',
    presenterNext: '',
    noteNow: '',
    noteNext: '',
    showNow: false,
    showNext: false,
  });

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Lower Thirds';
  }, []);

  // reload if data changes
  useEffect(() => {
    // clear titles if necessary
    // will trigger an animation out in the component
    let timeout: NodeJS.Timeout | null = null;
    if (
      title?.titleNow !== titles?.titleNow ||
      title?.subtitleNow !== titles?.subtitleNow ||
      title?.presenterNow !== titles?.presenterNow
    ) {
      setTitles((t) => ({ ...t, showNow: false }));

      const transitionTime = 2000;

      timeout = setTimeout(() => {
        setTitles(title);
      }, transitionTime);
    }

    return () => {
      if (timeout != null) {
        clearTimeout(timeout);
      }
    };
    // eslint-disable-next-line -- we do this to keep animations
  }, [title.titleNow, title.subtitleNow, title.presenterNow]);

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

  return <LowerLines lower={lower} title={titles} options={options} />;
};

export default memo(Lower, areEqual);
