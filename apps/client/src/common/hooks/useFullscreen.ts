import { useFullscreenDocument } from '@mantine/hooks';

interface UseFullscreenReturn {
  fullscreen: boolean;
  error: boolean;
  toggle: () => void;
}

// error is set without state so it is reset by a page refresh
let error = false;

export function useFullscreen(): UseFullscreenReturn {
  const { fullscreen, toggle } = useFullscreenDocument();
  const toggleFullScreen = () => {
    toggle().catch(() => {
      console.log('failed ot open');
      error = true;
    });
  };
  return { fullscreen, toggle: toggleFullScreen, error };
}
