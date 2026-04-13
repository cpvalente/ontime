// afterSign hook for electron-builder macOS notarization.
// Configured via: "afterSign": "./notarize.cjs" in the build config.
//
// Primary auth: Apple ID + app-specific password (APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID)
// Alternative:  App Store Connect API key — see commented block below.

const { notarize } = require('@electron/notarize');
const path = require('path');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  // Only notarize on macOS builds
  if (electronPlatformName !== 'darwin') return;

  // Skip if explicitly disabled (e.g. local unsigned builds via dist-mac:local)
  if (process.env.CSC_IDENTITY_AUTO_DISCOVERY === 'false') return;

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  // --- Apple ID + App-Specific Password (primary) ---
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  // --- App Store Connect API Key (alternative — uncomment to use instead) ---
  // const appleApiKey     = process.env.APPLE_API_KEY;       // Key ID, e.g. "ABCDE12345"
  // const appleApiIssuer  = process.env.APPLE_API_ISSUER;    // Issuer UUID from App Store Connect
  // const appleApiKeyPath = process.env.APPLE_API_KEY_PATH   // Full path to the .p8 private key file
  //   || path.join(process.env.HOME, 'private_keys', `AuthKey_${appleApiKey}.p8`);

  if (!appleId || !appleIdPassword || !teamId) {
    console.warn(
      '[notarize] Skipping: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, or APPLE_TEAM_ID not set.\n' +
      '           Set these environment variables to enable notarization.',
    );
    return;
  }

  console.log(`[notarize] Submitting ${appName} for notarization...`);

  await notarize({
    // Apple ID auth:
    tool: 'notarytool',
    appPath,
    appleId,
    appleIdPassword,
    teamId,

    // App Store Connect API key auth (uncomment and remove above):
    // tool: 'notarytool',
    // appPath,
    // appleApiKey,
    // appleApiIssuer,
    // appleApiKeyPath,
  });

  console.log(`[notarize] Done — ${appName} successfully notarized.`);
};
