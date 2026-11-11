/**
 * Decides what a client may change in a rundown's data. Playback is never limited here.
 *
 * Open: the rundown is not live.
 * Guarded: the rundown is loaded and playback is not stopped; edits stay possible.
 * Locked: the user locked this tab and the rundown is loaded, or the preset gives no write access; the data is read only.
 *
 * The status says how protected the rundown is, not what the preset allows: read the `can*` fields for that.
 * This is client UX, not a safety guarantee: HTTP, OSC and sheets still write.
 */
export type RundownPolicyStatus = 'open' | 'guarded' | 'locked';

export type RundownPolicyInput = {
  /** preset read permission: undefined or 'full' for every field, otherwise comma separated field keys */
  read?: string;
  /** preset write permission: undefined or 'full' for every field, '-' for none, otherwise comma separated field keys */
  write?: string;
  /** the user locked this tab, which only applies to the loaded rundown */
  locked: boolean;
  /** the rundown is the loaded one */
  isLoaded: boolean;
  /** playback is not stopped */
  isPlaying: boolean;
};

export type RundownPolicy = {
  status: RundownPolicyStatus;
  /** the user may lock and unlock this tab */
  canToggleLock: boolean;
  canRead: (key: string) => boolean;
  canWrite: (key: string) => boolean;
  canCreateEntries: boolean;
  canEditEntries: boolean;
  /** flags are rundown data, so a lock also stops flagging */
  canFlag: boolean;
};

function getPermissionKeys(permission: string | undefined): Set<string> {
  return permission ? new Set(permission.split(',')) : new Set<string>();
}

export function getRundownPolicy({ read, write, locked, isLoaded, isPlaying }: RundownPolicyInput): RundownPolicy {
  const readKeys = getPermissionKeys(read);
  const writeKeys = getPermissionKeys(write);
  const fullRead = read == null || read === 'full';
  const fullWrite = write == null || write === 'full';

  const canToggleLock = write !== '-';
  const isLocked = !canToggleLock || (locked && isLoaded);
  const status: RundownPolicyStatus = isLocked ? 'locked' : isLoaded && isPlaying ? 'guarded' : 'open';
  const canChange = !isLocked && fullWrite;

  return {
    status,
    canToggleLock,
    canRead: (key: string) => fullRead || readKeys.has(key),
    canWrite: (key: string) => !isLocked && (fullWrite || writeKeys.has(key)),
    canCreateEntries: canChange,
    canEditEntries: canChange,
    canFlag: !isLocked && (fullWrite || writeKeys.has('flag')),
  };
}
