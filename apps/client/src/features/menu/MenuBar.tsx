import { useCallback, useEffect } from 'react';
import { VStack } from '@chakra-ui/react';
import { FiHelpCircle } from '@react-icons/all-files/fi/FiHelpCircle';
import { FiMinimize } from '@react-icons/all-files/fi/FiMinimize';
import { FiSave } from '@react-icons/all-files/fi/FiSave';
import { FiUpload } from '@react-icons/all-files/fi/FiUpload';
import { IoExtensionPuzzle } from '@react-icons/all-files/io5/IoExtensionPuzzle';
import { IoExtensionPuzzleOutline } from '@react-icons/all-files/io5/IoExtensionPuzzleOutline';
import { IoScan } from '@react-icons/all-files/io5/IoScan';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';
import { downloadRundown } from '../../common/api/ontimeApi';

import QuitIconBtn from '../../common/components/buttons/QuitIconBtn';
import TooltipActionBtn from '../../common/components/buttons/TooltipActionBtn';
import useElectronEvent from '../../common/hooks/useElectronEvent';

import style from './MenuBar.module.scss';

interface MenuBarProps {
  isSettingsOpen: boolean;
  onSettingsOpen: () => void;
  onSettingsClose: () => void;
  isUploadOpen: boolean;
  onUploadOpen: () => void;
  isIntegrationOpen: boolean;
  onIntegrationOpen: () => void;
}

type Actions = 'min' | 'max' | 'shutdown' | 'help';

const buttonStyle = {
  fontSize: '1.5em',
  size: 'lg',
  colorScheme: 'white',
  _hover: {
    background: 'rgba(255, 255, 255, 0.10)', // $white-10
  },
  _active: {
    background: 'rgba(255, 255, 255, 0.13)', // $white-13
  },
};

export default function MenuBar(props: MenuBarProps) {
  const {
    isSettingsOpen,
    onSettingsOpen,
    onSettingsClose,
    isUploadOpen,
    onUploadOpen,
    isIntegrationOpen,
    onIntegrationOpen,
  } = props;
  const { isElectron, sendToElectron } = useElectronEvent();

  const actionHandler = useCallback(
    (action: Actions) => {
      // Stop crashes when testing locally
      if (!isElectron) {
        if (action === 'help') {
          window.open('https://cpvalente.gitbook.io/ontime/');
        }
      } else {
        switch (action) {
          case 'min':
            sendToElectron('set-window', 'to-tray');
            break;
          case 'max':
            sendToElectron('set-window', 'to-max');
            break;
          case 'shutdown':
            sendToElectron('shutdown', 'now');
            break;
          case 'help':
            sendToElectron('send-to-link', 'help');
            break;
          default:
            break;
        }
      }
    },
    [sendToElectron, isElectron],
  );

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
    <VStack>
      <QuitIconBtn clickHandler={() => actionHandler('shutdown')} />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<IoScan />}
        clickHandler={() => actionHandler('max')}
        tooltip='Show full window'
        aria-label='Show full window'
        isDisabled={!isElectron}
      />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiMinimize />}
        clickHandler={() => actionHandler('min')}
        tooltip='Minimise to tray'
        aria-label='Minimise to tray'
        isDisabled={!isElectron}
      />
      <div className={style.gap} />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiHelpCircle />}
        clickHandler={() => actionHandler('help')}
        tooltip='Help'
        aria-label='Help'
      />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<IoSettingsOutline />}
        className={isSettingsOpen ? style.open : ''}
        clickHandler={onSettingsOpen}
        tooltip='Settings'
        aria-label='Settings'
      />
      <div className={style.gap} />
      <TooltipActionBtn
        {...buttonStyle}
        icon={isIntegrationOpen ? <IoExtensionPuzzle /> : <IoExtensionPuzzleOutline />}
        className={isIntegrationOpen ? style.open : ''}
        clickHandler={onIntegrationOpen}
        tooltip='Integrations'
        aria-label='Integrations'
      />
      <div className={style.gap} />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiUpload />}
        className={isUploadOpen ? style.open : ''}
        clickHandler={onUploadOpen}
        tooltip='Upload showfile'
        aria-label='Upload showfile'
      />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiSave />}
        clickHandler={downloadRundown}
        tooltip='Export showfile'
        aria-label='Export showfile'
      />
    </VStack>
  );
}
