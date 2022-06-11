import React, { memo, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import LowerClean from './LowerClean';
import LowerLines from './LowerLines';
const isEqual = require('react-fast-compare');

const areEqual = (prevProps, nextProps) => {
  return (
    isEqual(prevProps.title, nextProps.title) &&
    isEqual(prevProps.lower, nextProps.lower)
  );
};

const Lower = (props) => {
  const { title, lower } = props;
  const [searchParams,] = useSearchParams();
  const [titles, setTitles] = useState({
    titleNow: '',
    titleNext: '',
    subtitleNow: '',
    subtitleNext: '',
    presenterNow: '',
    presenterNext: '',
    showNow: false,
    showNext: false,
  });
  const [preset, setPreset] = useState(1);
  const [lowerOptions, setLowerOptions] = useState({});

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Lower Thirds';
  }, []);

  // reload if data changes
  useEffect(() => {
    // clear titles if necessary
    // will trigger an animation out in the component
    let timeout = null;
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
    // eslint-disable-next-line
  }, [title.titleNow, title.subtitleNow, title.presenterNow]);

  // TODO: sanitize data
  // getting config from URL: preset, size, transition, bg, text, key
  // eg. http://localhost:3000/lower?bg=ff2&text=f00&size=0.6&transition=5
  // Check for user options
  useEffect(() => {
    // create aux
    const options = {};

    // preset: selector
    // Should be a number 1-n
    const p = parseInt(searchParams.get('preset'), 10);
    if (!isNaN(p)) setPreset(p);

    // size: multiplier
    // Should be a number 0.0-n
    const s = searchParams.get('size');
    if (s) options.size = s;

    // transitionIn: seconds
    // Should be a number 0-n
    const t = parseInt(searchParams.get('transition'), 10);
    if (!isNaN(t)) options.transitionIn = t;

    // textColour: string
    // Should be a hex string '#ffffff'
    const c = searchParams.get('text');
    if (c) options.textColour = `#${c}`;

    // bgColour: string
    // Should be a hex string '#ffffff'
    const b = searchParams.get('bg');
    if (b) options.bgColour = `#${b}`;

    // key: string
    // Should be a hex string '#00FF00' with key colour
    const k = searchParams.get('key');
    if (k) options.keyColour = `#${k}`;

    // fadeOut: seconds
    // Should be a number 0-n
    const f = parseInt(searchParams.get('fadeout'), 10);
    if (!isNaN(f)) options.fadeOut = f;

    // x: pixels
    // Should be a number 0-n
    const x = parseInt(searchParams.get('x'), 10);
    if (!isNaN(x)) options.posX = x;

    // y: pixels
    // Should be a number 0-n
    const y = parseInt(searchParams.get('y'), 10);
    if (!isNaN(y)) options.posY = y;

    setLowerOptions({
      ...options,
      set: true,
    });
  }, [searchParams]);

  // Defer rendering until we have data ready
  if (!lowerOptions.set) return null;

  switch (preset) {
    case 0:
      return (
        <LowerClean lower={lower} title={titles} options={lowerOptions} />
      );
    case 1:
      return (
        <LowerLines lower={lower} title={titles} options={lowerOptions} />
      );
    default:
      return (
        <LowerLines lower={lower} title={titles} options={lowerOptions} />
      );
  }
};

export default memo(Lower, areEqual);
