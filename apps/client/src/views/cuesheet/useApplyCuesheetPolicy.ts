import { useSessionStorage } from '@mantine/hooks';
import { URLPreset } from 'ontime-types';
import { useCallback, useEffect, useMemo } from 'react';

import { sessionScope } from '../../externals';
import { AppMode, sessionKeys } from '../../ontimeConfig';
import { getCuesheetPermissionsPolicy } from './cuesheet.policies';
import { useCuesheetPermissions } from './useTablePermissions';

type CuesheetPolicyOptions = {
  // Run mode is only meaningful for the loaded rundown — background rundowns force Edit.
  canRunMode: boolean;
};

/**
 * Applies cuesheet permissions to shared state and exposes the effective mode for the UI.
 */
export function useApplyCuesheetPolicy(
  preset: URLPreset | undefined,
  { canRunMode }: CuesheetPolicyOptions,
): {
  cuesheetMode: AppMode;
  setCuesheetMode: (mode: AppMode) => void;
} {
  const setPermissions = useCuesheetPermissions((state) => state.setPermissions);
  const canShareInSession = sessionScope === 'rw';
  const permissions = useMemo(
    () => getCuesheetPermissionsPolicy(preset, canShareInSession),
    [preset, canShareInSession],
  );

  const [storedCuesheetMode, setStoredCuesheetMode] = useSessionStorage({
    key: preset ? `${preset.alias}${sessionKeys.cuesheetMode}` : sessionKeys.cuesheetMode,
    defaultValue: preset ? AppMode.Run : AppMode.Edit,
  });

  const isModeLocked = !canRunMode || !permissions.canChangeMode;
  const cuesheetMode = isModeLocked ? AppMode.Edit : storedCuesheetMode;

  const setCuesheetMode = useCallback(
    (mode: AppMode) => {
      if (isModeLocked) return;
      setStoredCuesheetMode(mode);
    },
    [isModeLocked, setStoredCuesheetMode],
  );

  // Keep the shared permissions store aligned with the active preset policy.
  useEffect(() => {
    setPermissions(permissions);
  }, [permissions, setPermissions]);

  // Persist Edit mode when the policy forbids switching, so reloads stay consistent.
  useEffect(() => {
    if (isModeLocked) {
      setStoredCuesheetMode((mode) => (mode === AppMode.Edit ? mode : AppMode.Edit));
    }
  }, [isModeLocked, setStoredCuesheetMode]);

  return { cuesheetMode, setCuesheetMode };
}
