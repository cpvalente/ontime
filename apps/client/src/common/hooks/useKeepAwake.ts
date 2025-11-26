import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { PresetContext } from '../../common/context/PresetContext';

// wakelock is only available in secure contexts
// however, that is covered by the navigator check
export const canUseWakeLock = typeof window !== 'undefined' && 'wakeLock' in navigator;

/** @url https://developer.mozilla.org/en-US/docs/Web/API/WakeLock */
export function useKeepAwake() {
  const { keepAwake } = useKeepAwakeOptions();
  const [wakeLockSentinel, setWakeLockSentinel] = useState<WakeLockSentinel | null>(null);

  // listen to changes in the keepAwake state and modify the wake lock accordingly
  useEffect(() => {
    const removeLock = async () => {
      if (wakeLockSentinel) wakeLockSentinel.release().finally(() => setWakeLockSentinel(null));
    };

    const acquireLock = async () => {
      if (wakeLockSentinel && !wakeLockSentinel.released) return;
      setWakeLockSentinel(null);
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        setWakeLockSentinel(sentinel);
      } catch (_error) {
        /** Nothing to do here */
      }
    };

    const controller = new AbortController();
    if (!canUseWakeLock) return;

    if (keepAwake) {
      acquireLock();

      // we need to reacquire the lock when the page becomes visible again
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
  }, [keepAwake, wakeLockSentinel]);
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
  }, [keepAwake, setSearchParams]);

  return { keepAwake, toggleKeepAwake };
}
