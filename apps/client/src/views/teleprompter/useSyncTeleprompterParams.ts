import { use, useEffect } from 'react';
import { useSearchParams } from 'react-router';

import { PresetContext } from '../../common/context/PresetContext';
import { defaults } from './teleprompter.options';

const SETTLE_MS = 400;

interface LiveParams {
  speed: number;
  fontSize: number;
  flipH: boolean;
  flipV: boolean;
}

/** Keeps keyboard and overlay changes shareable through the URL. */
export function useSyncTeleprompterParams({ speed, fontSize, flipH, flipV }: LiveParams) {
  const [, setSearchParams] = useSearchParams();
  const isPreset = Boolean(use(PresetContext));

  useEffect(() => {
    if (isPreset) return;

    const timeout = setTimeout(() => {
      const values = {
        speed: speed === defaults.speed ? null : String(speed),
        fontSize: fontSize === defaults.fontSize ? null : String(fontSize),
        flipH: flipH === defaults.flipH ? null : String(flipH),
        flipV: flipV === defaults.flipV ? null : String(flipV),
      };

      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(values)) {
            if (value === null) {
              next.delete(key);
            } else {
              next.set(key, value);
            }
          }
          return next;
        },
        { replace: true },
      );
    }, SETTLE_MS);

    return () => clearTimeout(timeout);
  }, [flipH, flipV, fontSize, isPreset, setSearchParams, speed]);
}
