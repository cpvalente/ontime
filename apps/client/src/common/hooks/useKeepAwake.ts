import { useEffect, useState } from 'react';

/** @url https://developer.mozilla.org/en-US/docs/Web/API/WakeLock */
export async function useKeepAwake(lock: boolean) {
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
          console.info(sentinel);
          setWakeLockSentinel(sentinel);
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (lock) {
      acquireLock();
      document.addEventListener(
        'visibilitychange',
        () => {
          console.log('visibilitychange');
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
  }, [lock]);
}
