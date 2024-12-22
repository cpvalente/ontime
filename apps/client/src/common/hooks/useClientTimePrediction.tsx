import { useEffect, useState } from 'react';
import { MaybeNumber, Playback } from 'ontime-types';

import { useTimer } from './useSocket';

const rate = 100;

export const useClientTimePrediction = () => {
  const { current, playback } = useTimer();
  const [clientCurrent, setClientCurrent] = useState<MaybeNumber>(null);
  const [clientAdjust, setClientAdjust] = useState(0);

  useEffect(() => {
    let timeoutId: null | NodeJS.Timeout = null;
    timeoutId = setInterval(() => {
      setClientAdjust((val) => {
        if (val < 1000) {
          return val + rate;
        }
        return val;
      });
    }, rate);

    return () => {
      if (timeoutId) clearInterval(timeoutId);
    };
  }, []);

  useEffect(() => {
    setClientAdjust(0);
    if (current === null) {
      setClientCurrent(null);
    }
  }, [current]);

  useEffect(() => {
    if (playback === Playback.Pause) {
      setClientCurrent(current);
    } else if (current !== null) {
      setClientCurrent(current - clientAdjust);
    }
  }, [clientAdjust, current, playback]);

  return clientCurrent;
};
