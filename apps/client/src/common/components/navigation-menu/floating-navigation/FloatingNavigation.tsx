import { IoApps } from 'react-icons/io5';
import { IoSettingsOutline } from 'react-icons/io5';

import { useFadeOutOnInactivity } from '../../../hooks/useFadeOutOnInactivity';
import { cx } from '../../../utils/styleUtils';
import IconButton from '../../buttons/IconButton';

import style from './FloatingNavigation.module.scss';

interface FloatingNavigationProps {
  toggleMenu?: () => void;
  toggleSettings?: () => void;
}

export default function FloatingNavigation({ toggleMenu, toggleSettings }: FloatingNavigationProps) {
  const isButtonShown = useFadeOutOnInactivity(true);

  return (
    <div
      id='fadeable-navigation'
      className={cx([style.fadeable, style.buttonContainer, !isButtonShown && style.hidden])}
    >
      {toggleMenu && (
        <IconButton
          variant='subtle-white'
          size='xlarge'
          onClick={toggleMenu}
          aria-label='toggle menu'
          data-testid='navigation__toggle-menu'
        >
          <IoApps />
        </IconButton>
      )}
      {toggleSettings && (
        <IconButton
          variant='subtle-white'
          size='xlarge'
          onClick={toggleSettings}
          aria-label='toggle settings'
          data-testid='navigation__toggle-settings'
        >
          <IoSettingsOutline />
        </IconButton>
      )}
    </div>
  );
}
