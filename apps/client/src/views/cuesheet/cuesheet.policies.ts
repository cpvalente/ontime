import { URLPreset } from 'ontime-types';

import { getRundownPolicy } from '../../features/rundown/rundown.policy';
import { AppMode } from '../../ontimeConfig';
import type { CuesheetPermissions } from './useTablePermissions';

export function getCuesheetPermissionsPolicy(
  preset: URLPreset | undefined,
  canShareInSession: boolean,
): CuesheetPermissions {
  if (!preset) {
    return {
      canChangeMode: true,
      canCreateEntries: true,
      canEditEntries: true,
      canFlag: true,
      canShare: canShareInSession,
    };
  }

  // what the preset allows, regardless of the mode the user picked
  const policy = getRundownPolicy({
    read: preset?.options?.read,
    write: preset?.options?.write,
    locked: false,
    isLoaded: true,
    isPlaying: false,
  });

  return {
    canChangeMode: policy.canToggleLock,
    canCreateEntries: policy.canCreateEntries,
    canEditEntries: policy.canEditEntries,
    canFlag: policy.canFlag,
    canShare: false, // TODO: should be sessionScope === 'rw' when we have granular scopes
  };
}

export function getCuesheetColumnAccessPolicy(preset: URLPreset | undefined, cuesheetMode: AppMode) {
  const { canRead, canWrite } = getRundownPolicy({
    read: preset?.options?.read,
    write: preset?.options?.write,
    // Run mode is the cuesheet's lock; the cuesheet already forces Edit for a rundown that is not loaded
    locked: cuesheetMode === AppMode.Run,
    isLoaded: true,
    isPlaying: false,
  });

  return { canRead, canWrite };
}
