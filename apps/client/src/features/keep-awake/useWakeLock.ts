import { use, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';

import { PresetContext } from '../../common/context/PresetContext';

// wakelock is only available in secure contexts
// however, that is covered by the navigator check
export const canUseWakeLock = typeof window !== 'undefined' && 'wakeLock' in navigator;

/** @url https://developer.mozilla.org/en-US/docs/Web/API/WakeLock */
export function useWakelock() {
  const { keepAwake } = useKeepAwakeOptions();
  const wakeLockSentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const removeLock = () => {
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().finally(() => {
          wakeLockSentinelRef.current = null;
        });
      }
    };

    const acquireLock = () => {
      const sentinel = wakeLockSentinelRef.current;
      if (!sentinel || sentinel.released) {
        wakeLockSentinelRef.current = null;

        if (!canUseWakeLock) {
          return;
        }

        navigator.wakeLock
          .request('screen')
          .then((sentinel) => {
            wakeLockSentinelRef.current = sentinel;
          })
          .catch(console.error);
      }
    };

    const controller = new AbortController();
    if (keepAwake) {
      acquireLock();
      document.addEventListener(
        'visibilitychange',
        () => {
          if (wakeLockSentinelRef.current !== null && document.visibilityState === 'visible') {
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
