// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck -- working on it
import { useCallback, useEffect, useState } from 'react';

interface WebkitDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitIsFullScreen?: boolean;
  webkitExitFullscreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
}

export default function useFullscreen() {
  const [isFullScreen, setFullScreen] = useState(
    document.fullscreenElement || (document as WebkitDocument).webkitFullscreenElement,
  );

  useEffect(() => {
    const handleChange = () => {
      if (typeof (document as WebkitDocument).webkitFullscreenElement !== 'undefined') {
        setFullScreen((document as WebkitDocument).webkitFullscreenElement);
      } else {
        setFullScreen(document.fullscreenElement);
      }
    };
    (document as WebkitDocument).addEventListener('webkitfullscreenchange', handleChange, { passive: true });
    document.addEventListener('fullscreenchange', handleChange, { passive: true });
    document.addEventListener('resize', handleChange, { passive: true });

    return () => {
      (document as WebkitDocument).removeEventListener('webkitfullscreenchange', handleChange);
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('resize', handleChange);
    };
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement && !(document as WebkitDocument).webkitIsFullScreen) {
      // Fullscreen mode is not active, so we can enter fullscreen mode
      const element = document.documentElement;
      if (element.requestFullscreen) {
        // Standard fullscreen API is supported
        element.requestFullscreen().catch(() => {
          /* nothing to do */
        });
      } else if (element.webkitRequestFullscreen) {
        // iOS Safari fullscreen API is supported
        element.webkitRequestFullscreen?.().catch(() => {
          /* nothing to do */
        });
      }
    } else {
      // Fullscreen mode is active, so we can exit fullscreen mode
      if (document.exitFullscreen) {
        // Standard fullscreen API is supported
        document.exitFullscreen().catch((error) => {
          console.error('Error while trying to exit fullscreen:', error);
        });
      } else if ((document as WebkitDocument).webkitExitFullscreen) {
        // iOS Safari fullscreen API is supported
        (document as WebkitDocument).webkitExitFullscreen?.().catch(() => {
          /* nothing to do */
        });
      }
    }
  }, []);

  return { isFullScreen, toggleFullScreen };
}
