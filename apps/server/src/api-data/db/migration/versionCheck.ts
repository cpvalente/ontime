export function versionCheck(jsonData: object): { major: number; minor: number; patch: number; prerelease: string } | null {
  if (!('settings' in jsonData) || typeof jsonData.settings !== 'object' || jsonData.settings === null) {
    return null;
  }
  if (!('version' in jsonData.settings) || typeof jsonData.settings.version !== 'string') {
    return null;
  }

  const { version } = jsonData.settings;
  const [number, prerelease] = version.split('-');
  const [major, minor, patch] = number.split('.').map((v) => Number(v));

  return { major, minor, patch, prerelease };
}
