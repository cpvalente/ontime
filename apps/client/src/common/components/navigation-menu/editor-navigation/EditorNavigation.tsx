import { matchPath, useLocation, useNavigate } from 'react-router';

import { useIsSmallDevice } from '../../../hooks/useIsSmallDevice';
import NavigationMenuItem from '../navigation-menu-item/NavigationMenuItem';

export default function EditorNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isSmallDevice = useIsSmallDevice();

  const isCurrent = (path: string) => matchPath(path, pathname) !== null;

  if (!isSmallDevice) {
    return (
      <NavigationMenuItem active={isCurrent('/editor')} isProtected onClick={() => navigate('/editor')}>
        Editor
      </NavigationMenuItem>
    );
  }

  return (
    <>
      <NavigationMenuItem active={isCurrent('/timercontrol')} isProtected onClick={() => navigate('/timercontrol')}>
        Timer Controls
      </NavigationMenuItem>

      <NavigationMenuItem active={isCurrent('/messagecontrol')} isProtected onClick={() => navigate('/messagecontrol')}>
        Message Controls
      </NavigationMenuItem>

      <NavigationMenuItem active={isCurrent('/rundown')} isProtected onClick={() => navigate('/rundown')}>
        Rundown
      </NavigationMenuItem>
    </>
  );
}
