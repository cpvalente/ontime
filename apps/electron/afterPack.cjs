const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Remove resource forks from the packaged .app before electron-builder signs it.
 *
 * On HFS+ / APFS, resource forks live in a named fork stream accessible at
 * "<file>/..namedfork/rsrc". Opening that path for writing and closing it
 * immediately truncates the fork to zero bytes, satisfying codesign.
 */
exports.default = async function afterPack(context) {
  const appPath = `${context.appOutDir}/${context.packager.appInfo.productFilename}.app`;
  console.log(`afterPack: zeroing resource forks in ${appPath}`);

  // Write the Python helper to a temp file to avoid shell newline-escaping issues.
  const pyScript = [
    'import os, sys',
    'root = sys.argv[1]',
    'cleared = 0',
    'for dirpath, dirs, files in os.walk(root):',
    '    for fname in files:',
    '        fpath = os.path.join(dirpath, fname)',
    '        rsrc = fpath + "/..namedfork/rsrc"',
    '        try:',
    '            sz = os.path.getsize(rsrc)',
    '            if sz > 0:',
    '                open(rsrc, "wb").close()',
    '                cleared += 1',
    '                print("  cleared " + str(sz) + "b: " + os.path.relpath(fpath, root))',
    '        except Exception:',
    '            pass',
    'print("afterPack: " + str(cleared) + " resource fork(s) cleared")',
  ].join('\n');

  const scriptPath = path.join(os.tmpdir(), 'clear_rsrc.py');
  fs.writeFileSync(scriptPath, pyScript, 'utf8');

  execSync(`python3 "${scriptPath}" "${appPath}"`, { stdio: 'inherit' });

  // Remove AppleDouble sidecar files and strip remaining extended attributes.
  execSync(`find "${appPath}" -name "._*" -delete`);
  execSync(`xattr -cr "${appPath}"`);
};
