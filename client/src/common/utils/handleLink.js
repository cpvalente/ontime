/**
 * Open an external URLs: specifically for a electron / browser case
 * If electron: ask main process to call a new browser window
 * If browser: open in new tab
 * @param url
 */
export default function openLink(url) {
  console.log('2', url)
  if (window.process?.type === 'renderer') {
    window.ipcRenderer.send('send-to-link', url);
  } else {
    window.open(url);
  }
}