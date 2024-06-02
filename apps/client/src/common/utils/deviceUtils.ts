export function isMacOS() {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('macintosh') || userAgent.includes('mac os');
}

export const deviceAlt = isMacOS() ? 'Option' : 'Alt';

export const deviceMod = isMacOS() ? 'Cmd' : 'Ctrl';
