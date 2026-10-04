import type { TeleprompterPlayback } from 'ontime-types';
import { useEffect } from 'react';

import { onTeleprompterNudge } from '../../common/utils/socket';
import type { TeleprompterController } from './teleprompter.types';

interface UseTeleprompterRemoteArgs {
  isEnabled: boolean;
  playback: TeleprompterPlayback;
  controller: TeleprompterController;
  selectedEventId: string | null;
}

/** Drives the transport from the shared state set through the integration API */
export function useTeleprompterRemote({ isEnabled, playback, controller, selectedEventId }: UseTeleprompterRemoteArgs) {
  // mirrors the shared playback
  // also runs when the loaded event changes, so a view parked at the end of its segment carries on into the next
  useEffect(() => {
    if (!isEnabled) return;
    if (playback === 'playing') {
      controller.play();
    } else {
      controller.pause();
    }
  }, [isEnabled, playback, controller, selectedEventId]);

  // applies remote nudges
  useEffect(() => {
    if (!isEnabled) return;
    return onTeleprompterNudge((lines) => controller.nudge(lines, { preserveFollow: true }));
  }, [isEnabled, controller]);
}
