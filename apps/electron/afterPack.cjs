const { execSync } = require('child_process');

/**
 * Light post-packaging cleanup before codesign.
 *
 * The macOS build now outputs to /tmp (via --config.directories.output) to
 * avoid iCloud Drive adding com.apple.FinderInfo to directories inside
 * ~/Documents, which codesign rejects as "Finder information detritus".
 * Running outside iCloud means this hook is mostly a no-op safety measure.
 *
 * Still runs xattr -cr on the .app bundle in case the build environment
 * has other metadata-adding agents.
 *
 * No-op for Windows / Linux targets.
 */
exports.default = async function afterPack(context) {
  if (context.packager.platform.name !== 'mac') {
    return;
  }

  const appPath = `${context.appOutDir}/${context.packager.appInfo.productFilename}.app`;
  console.log(`afterPack: stripping extended attributes from ${appPath}`);

  execSync(`find "${appPath}" -name "._*" -delete`);
  execSync(`xattr -cr "${appPath}"`);

  console.log('afterPack: done');
};
