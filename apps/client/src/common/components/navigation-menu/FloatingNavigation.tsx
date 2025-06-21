import { IoApps } from 'react-icons/io5';
import { IoSettingsOutline } from 'react-icons/io5';

import { useFadeOutOnInactivity } from '../../hooks/useFadeOutOnInactivity';
import { cx } from '../../utils/styleUtils';
import IconButton from '../buttons/IconButton';

import style from './NavigationMenu.module.scss';

interface FloatingNavigationProps {
  toggleMenu: () => void;
  toggleSettings: () => void;
}

export default function FloatingNavigation(props: FloatingNavigationProps) {
  const { toggleMenu, toggleSettings } = props;
  const isButtonShown = useFadeOutOnInactivity();

  return (
    <div className={cx([style.fadeable, style.buttonContainer, !isButtonShown && style.hidden])}>
      <IconButton
        variant='subtle-white'
        className={style.navButton}
        onClick={toggleMenu}
        aria-label='toggle menu'
        data-testid='navigation__toggle-menu'
      >
        <IoApps />
      </IconButton>
      <IconButton
        variant='subtle-white'
        className={style.navButton}
        onClick={toggleSettings}
        aria-label='toggle settings'
        data-testid='navigation__toggle-settings'
      >
        <IoSettingsOutline />
      </IconButton>
    </div>
  );
}
