import { memo, useCallback, useEffect } from 'react';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';

import QuitIconBtn from '../../common/components/buttons/QuitIconBtn';
import TooltipActionBtn from '../../common/components/buttons/TooltipActionBtn';
import useElectronEvent from '../../common/hooks/useElectronEvent';
import { cx } from '../../common/utils/styleUtils';

import style from './MenuBar.module.scss';

interface MenuBarProps {
  openSettings: (newTab?: string) => void;
  isSettingsOpen: boolean;
}

const buttonStyle = {
  fontSize: '1.25em',
  size: 'md',
  colorScheme: 'white',
  _hover: {
    background: 'rgba(255, 255, 255, 0.10)', // $white-10
  },
  _active: {
    background: 'rgba(255, 255, 255, 0.13)', // $white-13
  },
};

const MenuBar = (props: MenuBarProps) => {
  const { openSettings, isSettingsOpen } = props;
  const { isElectron, sendToElectron } = useElectronEvent();

  const sendShutdown = () => {
    if (isElectron) {
      sendToElectron('shutdown', 'now');
    }
  };

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // handle held key
      if (event.repeat) return;

      // check if the ctrl key is pressed
      if (event.ctrlKey || event.metaKey) {
        // ctrl + , (settings)
        if (event.key === ',') {
          openSettings();
          event.preventDefault();
          event.stopPropagation();
        }
      }
    },
    [openSettings],
  );

  useEffect(() => {
    if (isElectron) {
      document.addEventListener('keydown', handleKeyPress);
    }
    return () => {
      if (isElectron) {
        document.removeEventListener('keydown', handleKeyPress);
      }
    };
  }, [handleKeyPress, isElectron]);

  return (
    <div className={style.menu}>
      <QuitIconBtn disabled={!isElectron} clickHandler={sendShutdown} />
      <TooltipActionBtn
        {...buttonStyle}
        className={cx([isSettingsOpen ? style.open : null, style.bottom])}
        icon={<IoSettingsOutline />}
        clickHandler={() => openSettings()}
        tooltip='Application settings'
        aria-label='Application settings'
      />
    </div>
  );
};

export default memo(MenuBar);
