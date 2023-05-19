import { useCallback, useEffect, useState } from 'react';

export default function useFullscreen() {
  const [isFullScreen, setFullScreen] = useState(document.fullscreenElement);

  useEffect(() => {
    const handleChange = () => {
      if (document.webkitFullscreenElement === null) {
        setFullScreen(false);
      } else if (document.webkitFullscreenElement) {
        setFullScreen(true);
      } else {
        setFullScreen(document.fullscreenElement);
      }
    };
    document.addEventListener('webkitfullscreenchange', handleChange, { passive: true });
    document.addEventListener('fullscreenchange', handleChange, { passive: true });
    document.addEventListener('resize', handleChange, { passive: true });

    return () => {
      document.removeEventListener('webkitfullscreenchange', handleChange, { passive: true });
      document.removeEventListener('fullscreenchange', handleChange, { passive: true });
      document.removeEventListener('resize', handleChange, { passive: true });
    };
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement && !document.webkitIsFullScreen) {
      // Fullscreen mode is not active, so we can enter fullscreen mode
      if (document.documentElement.requestFullscreen) {
        // Standard fullscreen API is supported
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        // iOS Safari fullscreen API is supported
        document.documentElement.webkitRequestFullscreen();
      }
    } else {
      // Fullscreen mode is active, so we can exit fullscreen mode
      if (document.exitFullscreen) {
        // Standard fullscreen API is supported
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        // iOS Safari fullscreen API is supported
        document.webkitExitFullscreen();
      }
    }
  }, []);

  return { isFullScreen, toggleFullScreen };
}
