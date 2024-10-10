import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const isElectron = window.process?.type === 'renderer';
const ipcRenderer = isElectron ? window.require('electron').ipcRenderer : null;

export default function useElectronEvent() {
  const navigate = useNavigate();

  const sendToElectron = useCallback((channel: string, args?: string | Record<string, unknown>) => {
    if (isElectron && ipcRenderer) {
      ipcRenderer.send(channel, args);
    }
  }, []);

  // listen to requests to change the editor location
  useEffect(() => {
    if (isElectron) {
      ipcRenderer.on('request-editor-location', (_event: unknown, location: string) => {
        navigate(location, { relative: 'route' });
      });
    }

    // Clean the listener after the component is dismounted
    return () => {
      ipcRenderer?.removeAllListeners();
    };
  }, [navigate]);

  return { isElectron, sendToElectron };
}
