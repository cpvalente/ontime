const { execSync } = require('child_process');

/**
 * Strip extended attributes (resource forks, Finder metadata) from the
 * packaged .app before electron-builder attempts to codesign it.
 * macOS codesign refuses to sign files that carry these attributes.
 */
exports.default = async function afterPack(context) {
  const appPath = `${context.appOutDir}/${context.packager.appInfo.productFilename}.app`;
  console.log(`afterPack: stripping extended attributes from ${appPath}`);
  execSync(`xattr -cr "${appPath}"`);
};
