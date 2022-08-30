import { useCallback, useEffect, useState } from 'react';


export default function useFullscreen() {
  const [isFullScreen, setFullScreen] = useState(document?.fullscreenElement);

  useEffect(() => {
    const handleChange = () => {
      setFullScreen(document?.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange, false);
    document.addEventListener('resize', handleChange, false);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('resize', handleChange);
    };  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setFullScreen(document?.fullscreenElement);
  }, []);

  return { isFullScreen, toggleFullScreen };
}
