import { useEffect, useState } from 'react';
import LowerClean from './LowerClean';
import LowerLines from './LowerLines';

export default function Lower(props) {
  const { title, ...rest } = props;
  const [titles, setTitles] = useState(null);
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
      console.log('DEBUG TITLES: SETTING TITLES TO NULL');
      setTitles((t) => ({ ...t, showNow: false }));

      const transitionTime = 2000;

      timeout = setTimeout(() => {
        console.log('DEBUG TITLES: RESUMING');
        setTitles(title);
      }, transitionTime);
    }

    return () => {
      if (timeout != null) {
        console.log('DEBUG TITLES: CLEARING');

        clearTimeout(timeout);
      }
    };
  }, [title.titleNow, title.subtitleNow, title.presenterNow]);

  // TODO: sanitize data
  // getting config from URL: preset, size, transition, bg, text, key
  // eg. http://localhost:3000/lower?bg=ff2&text=f00&size=0.6&transition=5
  // Check for user options
  useEffect(() => {
    // get parameters
    const params = new URLSearchParams(props.location.search);
    // create aux
    let options = {};

    // preset: selector
    // Should be a number 1-n
    let p = parseInt(params.get('preset'));
    if (!isNaN(p)) setPreset(p);

    // size: multiplier
    // Should be a number 0.0-n
    let s = params.get('size');
    if (s) options.size = s;

    // transitionIn: seconds
    // Should be a number 0-n
    let t = parseInt(params.get('transition'));
    if (!isNaN(t)) options.transitionIn = t;

    // textColour: string
    // Should be a hex string '#ffffff'
    let c = params.get('text');
    if (c) options.textColour = `#${c}`;

    // bgColour: string
    // Should be a hex string '#ffffff'
    let b = params.get('bg');
    if (b) options.bgColour = `#${b}`;

    // key: string
    // Should be a hex string '#00FF00' with key colour
    let k = params.get('key');
    if (k) options.keyColour = `#${k}`;

    // fadeOut: seconds
    // Should be a number 0-n
    let f = parseInt(params.get('fadeout'));
    if (!isNaN(f)) options.fadeOut = f;

    // x: pixels
    // Should be a number 0-n
    let x = parseInt(params.get('x'));
    if (!isNaN(x)) options.posX = x;

    // y: pixels
    // Should be a number 0-n
    let y = parseInt(params.get('y'));
    if (!isNaN(y)) options.posY = y;

    setLowerOptions({
      ...options,
      set: true,
    });
  }, [props.location.search]);

  // Defer rendering until we have data ready
  if (!lowerOptions.set) return null;

  switch (preset) {
    case 0:
      return <LowerClean {...rest} title={title} options={lowerOptions} />;
    case 1:
      return <LowerLines {...rest} title={titles} options={lowerOptions} />;
    default:
      return <LowerLines {...rest} title={title} options={lowerOptions} />;
  }
}
