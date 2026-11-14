import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';

import { addDialog } from '../stores/dialogStore';

const isElectron = window.process?.type === 'renderer';
const ipcRenderer = isElectron ? window.require('electron').ipcRenderer : null;

export function useElectronEvent() {
  const sendToElectron = useCallback((channel: string, args?: string | Record<string, unknown>) => {
    if (isElectron && ipcRenderer) {
      ipcRenderer.send(channel, args);
    }
  }, []);

  return { isElectron, sendToElectron };
}

export function useElectronListener() {
  const navigate = useNavigate();
  const { isElectron } = useElectronEvent();

  // listen to requests to change the editor location
  useEffect(() => {
    const onLocation = (_event: unknown, location: string) => navigate(location, { relative: 'route' });
    const onDialog = (_event: unknown, dialog: string) => {
      if (dialog === 'welcome') addDialog('welcome');
    };
    if (isElectron) {
      ipcRenderer.on('request-editor-location', onLocation);
      ipcRenderer.on('dialog', onDialog);
    }

    // Clean the listener after the component is dismounted
    return () => {
      ipcRenderer?.removeListener('request-editor-location', onLocation);
      ipcRenderer?.removeListener('dialog', onDialog);
    };
  }, [isElectron, navigate]);
}
