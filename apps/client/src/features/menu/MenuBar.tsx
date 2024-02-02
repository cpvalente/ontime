import { memo, useCallback, useEffect } from 'react';
import { IconButton, MenuButton, Tooltip } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoCloud } from '@react-icons/all-files/io5/IoCloud';
import { IoCloudOutline } from '@react-icons/all-files/io5/IoCloudOutline';
import { IoColorWand } from '@react-icons/all-files/io5/IoColorWand';
import { IoExtensionPuzzle } from '@react-icons/all-files/io5/IoExtensionPuzzle';
import { IoExtensionPuzzleOutline } from '@react-icons/all-files/io5/IoExtensionPuzzleOutline';
import { IoOptions } from '@react-icons/all-files/io5/IoOptions';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoPushOutline } from '@react-icons/all-files/io5/IoPushOutline';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';
import { IoSnowOutline } from '@react-icons/all-files/io5/IoSnowOutline';

import QuitIconBtn from '../../common/components/buttons/QuitIconBtn';
import TooltipActionBtn from '../../common/components/buttons/TooltipActionBtn';
import useElectronEvent from '../../common/hooks/useElectronEvent';
import { AppMode, useAppMode } from '../../common/stores/appModeStore';
import { cx } from '../../common/utils/styleUtils';

import RundownMenu from './RundownMenu';

import style from './MenuBar.module.scss';

interface MenuBarProps {
  isOldSettingsOpen: boolean;
  onSettingsOpen: () => void;
  onSettingsClose: () => void;
  isUploadOpen: boolean;
  onUploadOpen: () => void;
  isIntegrationOpen: boolean;
  onIntegrationOpen: () => void;
  isQuickStartOpen: boolean;
  onQuickStartOpen: () => void;
  isSheetsOpen: boolean;
  onSheetsOpen: () => void;
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
  const {
    isOldSettingsOpen,
    onSettingsOpen,
    onSettingsClose,
    isUploadOpen,
    onUploadOpen,
    isIntegrationOpen,
    onIntegrationOpen,
    isQuickStartOpen,
    onQuickStartOpen,
    openSettings,
    isSettingsOpen,
    isSheetsOpen,
    onSheetsOpen,
  } = props;
  const { isElectron, sendToElectron } = useElectronEvent();

  const appMode = useAppMode((state) => state.mode);
  const setAppMode = useAppMode((state) => state.setMode);

  const setRunMode = () => setAppMode(AppMode.Run);
  const setEditMode = () => setAppMode(AppMode.Edit);
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
          // open if not open
          isSettingsOpen ? onSettingsClose() : onSettingsOpen();
        }
      }
    },
    [isSettingsOpen, onSettingsClose, onSettingsOpen],
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
      <div className={style.gap} />
      <TooltipActionBtn
        {...buttonStyle}
        isDisabled={appMode === AppMode.Run}
        icon={<IoColorWand />}
        className={isQuickStartOpen ? style.open : ''}
        clickHandler={onQuickStartOpen}
        tooltip='Quick start'
        aria-label='Quick start'
      />
      <TooltipActionBtn
        {...buttonStyle}
        isDisabled={appMode === AppMode.Run}
        icon={<IoPushOutline />}
        className={isUploadOpen ? style.open : ''}
        clickHandler={onUploadOpen}
        tooltip='Import project file'
        aria-label='Import project file'
      />
      <div className={style.gap} />
      <RundownMenu>
        <Tooltip label='Rundown...'>
          <MenuButton as={IconButton} icon={<IoAdd />} {...buttonStyle} aria-label='Rundown menu' />
        </Tooltip>
      </RundownMenu>
      <TooltipActionBtn
        {...buttonStyle}
        icon={<IoSnowOutline />}
        className={appMode === AppMode.Run ? style.open : ''}
        clickHandler={setRunMode}
        tooltip='Freeze rundown'
        aria-label='Freeze rundown'
      />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<IoPlay />}
        className={appMode === AppMode.Run ? style.open : ''}
        clickHandler={setRunMode}
        tooltip='Run mode'
        aria-label='Run mode'
      />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<IoOptions />}
        className={appMode === AppMode.Edit ? style.open : ''}
        clickHandler={setEditMode}
        tooltip='Edit mode'
        aria-label='Edit mode'
      />
      <div className={style.gap} />
      <TooltipActionBtn
        {...buttonStyle}
        isDisabled={appMode === AppMode.Run}
        icon={isSheetsOpen ? <IoCloud /> : <IoCloudOutline />}
        className={isSheetsOpen ? style.open : ''}
        clickHandler={onSheetsOpen}
        tooltip='Sheets'
        aria-label='Sheets'
      />
      <TooltipActionBtn
        {...buttonStyle}
        isDisabled={appMode === AppMode.Run}
        icon={isIntegrationOpen ? <IoExtensionPuzzle /> : <IoExtensionPuzzleOutline />}
        className={isIntegrationOpen ? style.open : ''}
        clickHandler={onIntegrationOpen}
        tooltip='Integrations'
        aria-label='Integrations'
      />
      <TooltipActionBtn
        {...buttonStyle}
        isDisabled={appMode === AppMode.Run}
        icon={<IoSettingsOutline />}
        className={isOldSettingsOpen ? style.open : ''}
        clickHandler={onSettingsOpen}
        tooltip='Settings'
        aria-label='Settings'
      />

      <TooltipActionBtn
        {...buttonStyle}
        className={cx([isSettingsOpen ? style.open : null, style.bottom])}
        icon={<IoSettingsOutline />}
        clickHandler={() => openSettings()}
        tooltip='About'
        aria-label='About'
      />
    </div>
  );
};

export default memo(MenuBar);
