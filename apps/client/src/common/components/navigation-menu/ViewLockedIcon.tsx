import { IoLockClosedOutline } from 'react-icons/io5';

import { useFadeOutOnInactivity } from '../../hooks/useFadeOutOnInactivity';
import { cx } from '../../utils/styleUtils';

import style from './NavigationMenu.module.scss';

export default function ViewLockedIcon() {
  const isLockIconShown = useFadeOutOnInactivity();

  return (
    <div className={cx([style.fadeable, style.lockIcon, !isLockIconShown && style.hidden])}>
      <IoLockClosedOutline />
    </div>
  );
}
