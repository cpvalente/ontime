const { apiRepoLatest, isMac, isWindows, version } = require('./externals.js');

/**
 * Resolves the name of the release artifact for the current platform
 * Names are defined in the electron-builder config
 * @returns {string}
 */
function getInstallerName() {
  if (isWindows) {
    return 'ontime-win64.exe';
  }
  if (isMac) {
    return `ontime-macOS-${process.arch}.dmg`;
  }
  const arch = { x64: 'x86_64', arm: 'armv7l' }[process.arch] ?? process.arch;
  return `ontime-linux-${arch}.AppImage`;
}

/**
 * Checks the latest GitHub release against the running version
 * An update is only offered once the installer for this platform has been uploaded
 * @returns {Promise<{ version: string, url: string } | null>} - null if there is no update to offer
 */
async function getAvailableUpdate() {
  const response = await fetch(apiRepoLatest, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(`Failed to fetch latest release: ${response.status}`);
  }

  const release = await response.json();
  if (release.tag_name.replace(/^v/, '') === version) {
    return null;
  }

  const installerName = getInstallerName();
  const installer = release.assets?.find((asset) => asset.name === installerName);
  if (!installer) {
    return null;
  }

  return { version: release.tag_name, url: installer.browser_download_url };
}

module.exports = { getAvailableUpdate };
