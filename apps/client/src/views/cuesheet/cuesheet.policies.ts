import { URLPreset } from 'ontime-types';

import { AppMode } from '../../ontimeConfig';
import type { CuesheetPermissions } from './useTablePermissions';

function getPermissionKeys(permission: string | undefined): Set<string> {
  return permission ? new Set(permission.split(',')) : new Set<string>();
}

function getCuesheetPermissions(readPermission: string | undefined, writePermission: string | undefined) {
  const readKeys = getPermissionKeys(readPermission);
  const writeKeys = getPermissionKeys(writePermission);
  const fullRead = readPermission == null || readPermission === 'full';
  const fullWrite = writePermission == null || writePermission === 'full';

  return {
    writePermission,
    readKeys,
    writeKeys,
    fullRead,
    fullWrite,
  };
}

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

  const { writePermission, writeKeys, fullWrite } = getCuesheetPermissions(
    preset?.options?.read,
    preset?.options?.write,
  );

  return {
    canChangeMode: writePermission !== '-',
    canCreateEntries: fullWrite,
    canEditEntries: fullWrite,
    canFlag: fullWrite || writeKeys.has('flag'),
    canShare: false, // TODO: should be sessionScope === 'rw' when we have granular scopes
  };
}

export function getCuesheetColumnAccessPolicy(preset: URLPreset | undefined, cuesheetMode: AppMode) {
  const { readKeys, writeKeys, fullRead, fullWrite } = getCuesheetPermissions(
    preset?.options?.read,
    preset?.options?.write,
  );
  const modeAllowsWrite = cuesheetMode === AppMode.Edit;

  return {
    canRead: (key: string) => fullRead || readKeys.has(key),
    canWrite: (key: string) => modeAllowsWrite && (fullWrite || writeKeys.has(key)),
  };
}
