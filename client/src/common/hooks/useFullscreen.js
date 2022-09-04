import { useCallback, useEffect, useState } from 'react';


export default function useFullscreen() {
  const [isFullScreen, setFullScreen] = useState(document.fullscreenElement);

  useEffect(() => {
    const handleChange = () => {
      setFullScreen(document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange, { passive: true });
    document.addEventListener('resize', handleChange, { passive: true });

    return () => {
      document.removeEventListener('fullscreenchange', handleChange, { passive: true });
      document.removeEventListener('resize', handleChange, { passive: true });
    };  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setFullScreen(document.fullscreenElement);
  }, []);

  return { isFullScreen, toggleFullScreen };
}
