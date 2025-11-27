import { useWakelock } from './useWakeLock';

/**
 * Composes the wakelock hook to contain re-renders
 */
export default function KeepAwake() {
  useWakelock();

  return null;
}
