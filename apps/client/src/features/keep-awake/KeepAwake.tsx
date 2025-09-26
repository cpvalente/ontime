import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { PresetContext } from '../../common/context/PresetContext';

/** @url https://developer.mozilla.org/en-US/docs/Web/API/WakeLock */
export default function KeepAwake() {
  const { keepAwake } = useKeepAwakeOptions();
  const [wakeLockSentinel, setWakeLockSentinel] = useState<WakeLockSentinel | null>(null);

  const removeLock = () => {
    if (wakeLockSentinel) wakeLockSentinel.release().finally(() => setWakeLockSentinel(null));
  };

  const acquireLock = () => {
    if (!wakeLockSentinel || wakeLockSentinel.released) {
      setWakeLockSentinel(null);
      navigator.wakeLock
        .request('screen')
        .then((sentinel) => {
          setWakeLockSentinel(sentinel);
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (keepAwake) {
      acquireLock();
      document.addEventListener(
        'visibilitychange',
        () => {
          if (wakeLockSentinel !== null && document.visibilityState === 'visible') {
            acquireLock();
          }
        },
        { signal: controller.signal },
      );
    } else {
      removeLock();
    }

    return () => {
      controller.abort();
      removeLock();
    };
  }, [keepAwake]);

  return <></>;
}

const keepAwakeKey = 'keep-awake';

function getOptionsFromParams(searchParams: URLSearchParams, defaultValues?: URLSearchParams) {
  // Helper to get value from either source, prioritizing defaultValues
  return defaultValues?.has(keepAwakeKey) || searchParams.has(keepAwakeKey);
}

/**
 * Hook exposes the keep awake options
 */
export function useKeepAwakeOptions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const maybePreset = use(PresetContext);

  const keepAwake = useMemo(() => {
    const defaultValues = maybePreset ? new URLSearchParams(maybePreset.search) : undefined;
    return getOptionsFromParams(searchParams, defaultValues);
  }, [maybePreset, searchParams]);

  const toggleKeepAwake = useCallback(() => {
    setSearchParams((searchParams) => {
      if (keepAwake) {
        searchParams.delete(keepAwakeKey);
      } else {
        searchParams.set(keepAwakeKey, '1');
      }
      return searchParams;
    });
  }, [keepAwake]);

  return { keepAwake, toggleKeepAwake };
}
