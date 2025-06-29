import { IoLockClosedOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

import { useIsSmallDevice } from '../../../hooks/useIsSmallDevice';
import NavigationMenuItem from '../navigation-menu-item/NavigationMenuItem';

export default function EditorNavigation() {
  const navigate = useNavigate();
  const isSmallDevice = useIsSmallDevice();

  if (!isSmallDevice) {
    return (
      <NavigationMenuItem active={location.pathname === '/editor'} onClick={() => navigate('/editor')}>
        <IoLockClosedOutline />
        Editor
      </NavigationMenuItem>
    );
  }

  return (
    <>
      <NavigationMenuItem active={location.pathname === '/timercontrol'} onClick={() => navigate('/timercontrol')}>
        <IoLockClosedOutline />
        Timer Controls
      </NavigationMenuItem>

      <NavigationMenuItem active={location.pathname === '/messagecontrol'} onClick={() => navigate('/messagecontrol')}>
        <IoLockClosedOutline />
        Message Controls
      </NavigationMenuItem>

      <NavigationMenuItem active={location.pathname === '/rundown'} onClick={() => navigate('/rundown')}>
        <IoLockClosedOutline />
        Rundown
      </NavigationMenuItem>
    </>
  );
}
