import { useEffect, useState } from 'react';

/** @url https://developer.mozilla.org/en-US/docs/Web/API/WakeLock */
export async function useKeepAwake(lock: boolean) {
  const [wakeLockSentinel, setWakeLockSentinel] = useState<WakeLockSentinel | null>(null);

  const removeLock = async () => {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release();
      console.log(wakeLockSentinel);
      setWakeLockSentinel(null);
    }
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
    console.log('widown lock?', lock);
    if (lock) {
      acquireLock();
    } else {
      removeLock().catch(console.error);
    }

    return () => {
      removeLock().catch(console.error);
    };
  }, [lock]);
}
