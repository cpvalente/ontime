import { useSessionStorage } from '@mantine/hooks';
import { URLPreset } from 'ontime-types';
import { useCallback, useEffect, useMemo } from 'react';

import { sessionScope } from '../../externals';
import { AppMode, sessionKeys } from '../../ontimeConfig';
import { getCuesheetPermissionsPolicy } from './cuesheet.policies';
import type { CuesheetPermissions } from './useTablePermissions';
import { useCuesheetPermissions } from './useTablePermissions';

type CuesheetPolicyOptions = {
  // Run mode is only meaningful for the loaded rundown — background rundowns force Edit.
  canRunMode: boolean;
};

export function getEffectiveCuesheetMode(
  permissions: Pick<CuesheetPermissions, 'canChangeMode'>,
  storedMode: AppMode,
  { canRunMode }: CuesheetPolicyOptions,
) {
  if (!permissions.canChangeMode) {
    return AppMode.Run;
  }

  return canRunMode ? storedMode : AppMode.Edit;
}

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

  const cuesheetMode = getEffectiveCuesheetMode(permissions, storedCuesheetMode, { canRunMode });

  const setCuesheetMode = useCallback(
    (mode: AppMode) => {
      if (!permissions.canChangeMode || !canRunMode) return;
      setStoredCuesheetMode(mode);
    },
    [canRunMode, permissions.canChangeMode, setStoredCuesheetMode],
  );

  // Keep the shared permissions store aligned with the active preset policy.
  useEffect(() => {
    setPermissions(permissions);
  }, [permissions, setPermissions]);

  // Force Run mode whenever the policy forbids mode switching.
  useEffect(() => {
    if (!permissions.canChangeMode) {
      setStoredCuesheetMode((mode) => (mode === AppMode.Run ? mode : AppMode.Run));
    }
  }, [permissions.canChangeMode, setStoredCuesheetMode]);

  return { cuesheetMode, setCuesheetMode };
}
