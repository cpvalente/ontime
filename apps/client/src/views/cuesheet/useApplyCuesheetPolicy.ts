import { useCallback, useEffect, useMemo } from 'react';
import { useSessionStorage } from '@mantine/hooks';
import { URLPreset } from 'ontime-types';

import { sessionScope } from '../../externals';
import { AppMode, sessionKeys } from '../../ontimeConfig';

import { getCuesheetPermissionsPolicy } from './cuesheet.policies';
import { useCuesheetPermissions } from './useTablePermissions';

/**
 * Applies cuesheet permissions to shared state and exposes the effective mode for the UI.
 */
export function useApplyCuesheetPolicy(preset: URLPreset | undefined): {
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

  const cuesheetMode = permissions.canChangeMode ? storedCuesheetMode : AppMode.Run;
  const setCuesheetMode = useCallback(
    (mode: AppMode) => {
      if (!permissions.canChangeMode) {
        return;
      }

      setStoredCuesheetMode(mode);
    },
    [permissions.canChangeMode, setStoredCuesheetMode],
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
