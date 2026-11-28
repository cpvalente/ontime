import { IoApps, IoSettingsOutline } from 'react-icons/io5';

import { useFadeOutOnInactivity } from '../../../hooks/useFadeOutOnInactivity';
import { deviceMod } from '../../../utils/deviceUtils';
import { cx } from '../../../utils/styleUtils';
import IconButton from '../../buttons/IconButton';
import Tooltip from '../../tooltip/Tooltip';

import style from './FloatingNavigation.module.scss';

interface FloatingNavigationProps {
  toggleMenu?: () => void;
  toggleSettings?: () => void;
  hasSavedChanges?: boolean;
}

export default function FloatingNavigation({ toggleMenu, toggleSettings, hasSavedChanges }: FloatingNavigationProps) {
  const isButtonShown = useFadeOutOnInactivity(true);

  return (
    <div
      id='fadeable-navigation'
      className={cx([style.fadeable, style.buttonContainer, !isButtonShown && style.hidden])}
    >
      {toggleMenu && (
        <Tooltip
          text='Open menu'
          render={
            <IconButton
              variant='subtle-white'
              size='xlarge'
              onClick={toggleMenu}
              aria-label='Open menu'
              data-testid='navigation__toggle-menu'
            />
          }
        >
          <IoApps />
        </Tooltip>
      )}
      {toggleSettings && (
        <div className={style.buttonWithIndicator}>
          <Tooltip
            text={`Customise view (${deviceMod} + ,)`}
            render={
              <IconButton
                variant='subtle-white'
                size='xlarge'
                onClick={toggleSettings}
                aria-label='Customise view'
                data-testid='navigation__toggle-settings'
              />
            }
          >
            <IoSettingsOutline />
          </Tooltip>
          {hasSavedChanges && <span className={style.indicator} data-testid='navigation__saved-indicator' />}
        </div>
      )}
    </div>
  );
}
