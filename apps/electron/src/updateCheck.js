const { apiRepoLatest, isMac, isWindows, linkToDownloads, version } = require('./externals.js');

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
 * Resolves the download page slug for the current platform
 * Slugs are a permanent contract with getontime.no/download/<slug>
 * @returns {string}
 */
function getDownloadSlug() {
  if (isWindows) {
    return 'windows';
  }
  if (isMac) {
    return `macos-${process.arch}`;
  }
  const arch = { x64: 'x64', arm64: 'arm64', arm: 'armv7' }[process.arch] ?? process.arch;
  return `linux-${arch}`;
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
  const hasInstaller = release.assets?.some((asset) => asset.name === installerName);
  if (!hasInstaller) {
    return null;
  }

  // pinned to the version we announce, the download page may still be caching the previous release
  const url = `${linkToDownloads}/${getDownloadSlug()}?version=${encodeURIComponent(release.tag_name)}`;
  return { version: release.tag_name, url };
}

module.exports = { getAvailableUpdate };
