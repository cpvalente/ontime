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
      if (document.documentElement.requestFullscreen) {
        // Standard fullscreen API is supported
        document.documentElement.requestFullscreen();
        // @ts-expect-error -- the whole casting dance is not worth it
      } else if (document.documentElement.webkitRequestFullscreen) {
        // iOS Safari fullscreen API is supported
        // @ts-expect-error -- we know this is not undefined now
        (document.documentElement as WebkitDocument).webkitRequestFullscreen();
      }
    } else {
      // Fullscreen mode is active, so we can exit fullscreen mode
      if (document.exitFullscreen) {
        // Standard fullscreen API is supported
        document.exitFullscreen();
      } else if ((document as WebkitDocument).webkitExitFullscreen) {
        // iOS Safari fullscreen API is supported
        // @ts-expect-error -- we know this is not undefined now
        (document as WebkitDocument).webkitExitFullscreen();
      }
    }
  }, []);

  return { isFullScreen, toggleFullScreen };
}
