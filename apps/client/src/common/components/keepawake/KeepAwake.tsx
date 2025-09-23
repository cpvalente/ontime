import { useEffect, useState } from 'react';
import { useViewOptionsStore } from '../../stores/viewOptions';

/** @url https://developer.mozilla.org/en-US/docs/Web/API/WakeLock */
export default function KeepAwake() {
  const { keepAwake } = useViewOptionsStore();
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
