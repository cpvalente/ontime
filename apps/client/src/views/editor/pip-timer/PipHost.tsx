import { ErrorBoundary } from '@sentry/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { CornerPipButton } from '../../../common/components/editor-utils/EditorUtils';
import useViewSettings from '../../../common/hooks-query/useViewSettings';
import { PipTimer } from './PipTimer';

export default function PipTimerHost() {
  const { data, status } = useViewSettings();
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);

  // do not leave an orphan window if the editor goes away
  useEffect(() => {
    return () => {
      window.documentPictureInPicture.window?.close();
    };
  }, []);

  const openPictureInPicture = async () => {
    const existingWindow = window.documentPictureInPicture.window;
    if (existingWindow) {
      existingWindow.close();
      return;
    }

    let pipWindow: Window;
    try {
      pipWindow = await window.documentPictureInPicture.requestWindow();
    } catch (err) {
      console.error('Failed to open Picture-in-Picture:', err);
      return;
    }

    [...document.styleSheets].forEach((sheet) => {
      try {
        if (sheet.href) {
          const link = pipWindow.document.createElement('link');
          link.rel = 'stylesheet';
          link.href = sheet.href;
          pipWindow.document.head.appendChild(link);
        } else if (sheet.cssRules) {
          const style = pipWindow.document.createElement('style');
          style.textContent = [...sheet.cssRules].map((rule) => rule.cssText).join('');
          pipWindow.document.head.appendChild(style);
        }
      } catch (e) {
        console.warn('Stylesheet copy blocked:', e);
      }
    });

    const pipDiv = pipWindow.document.createElement('div');
    pipDiv.setAttribute('id', 'pip-root');
    pipDiv.style.height = '100vh';
    pipWindow.document.body.append(pipDiv);

    pipWindow.addEventListener('pagehide', () => setPipContainer(null));
    setPipContainer(pipDiv);
  };

  // rendering through a portal keeps the PiP window in our React tree, so it follows view settings changes
  return (
    <>
      <CornerPipButton onClick={status === 'success' ? openPictureInPicture : undefined} />
      {pipContainer &&
        createPortal(
          <ErrorBoundary>
            <PipTimer viewSettings={data} />
          </ErrorBoundary>,
          pipContainer,
        )}
    </>
  );
}
