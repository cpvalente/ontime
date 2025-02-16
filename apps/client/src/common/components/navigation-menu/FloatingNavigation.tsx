import { IoApps } from '@react-icons/all-files/io5/IoApps';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';

import { useFadeOutOnInactivity } from '../../../common/hooks/useFadeOutOnInactivity';
import { cx } from '../../utils/styleUtils';

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
      <button
        onClick={toggleMenu}
        aria-label='toggle menu'
        className={style.navButton}
        data-testid='navigation__toggle-menu'
      >
        <IoApps />
      </button>
      <button
        className={style.button}
        onClick={toggleSettings}
        aria-label='toggle settings'
        data-testid='navigation__toggle-settings'
      >
        <IoSettingsOutline />
      </button>
    </div>
  );
}
