import { ErrorBoundary } from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import { CornerPipButton } from '../../../common/components/editor-utils/EditorUtils';
import useViewSettings from '../../../common/hooks-query/useViewSettings';
import { ontimeQueryClient } from '../../../common/queryClient';
import { PipTimer } from './PipTimer';

export default function PipTimerHost() {
  const { data, status } = useViewSettings();

  const openPictureInPicture = async () => {
    if (window.documentPictureInPicture.window) {
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

    const pipRoot = createRoot(pipWindow.document.getElementById('pip-root') as Element, {
      onCaughtError: (err, _errInfo) => console.error(err),
      onUncaughtError: (err, _errInfo) => console.error(err),
      onRecoverableError: (err, _errInfo) => console.error(err),
    });

    pipWindow.addEventListener('pagehide', () => {
      pipRoot.unmount();
    });

    pipRoot.render(
      <ErrorBoundary>
        {/* the PiP document is a separate react root, it needs its own provider to reach the query cache */}
        <QueryClientProvider client={ontimeQueryClient}>
          <PipTimer viewSettings={data} />
        </QueryClientProvider>
      </ErrorBoundary>,
    );
  };

  return <CornerPipButton onClick={status === 'success' ? openPictureInPicture : undefined} />;
}
