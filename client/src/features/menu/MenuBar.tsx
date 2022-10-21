import { useCallback, useEffect } from 'react';
import { VStack } from '@chakra-ui/react';
import { FiHelpCircle } from '@react-icons/all-files/fi/FiHelpCircle';
import { FiMaximize } from '@react-icons/all-files/fi/FiMaximize';
import { FiMinimize } from '@react-icons/all-files/fi/FiMinimize';
import { FiSave } from '@react-icons/all-files/fi/FiSave';
import { FiUpload } from '@react-icons/all-files/fi/FiUpload';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';
import { downloadEvents } from 'common/api/ontimeApi';

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
}

type Actions = 'min' | 'max' | 'shutdown' | 'help';

const buttonStyle = {
  fontSize: '1.5em',
  size: 'lg',
  colorScheme: 'white',
};

export default function MenuBar(props: MenuBarProps) {
  const { isSettingsOpen, onSettingsOpen, onSettingsClose, isUploadOpen, onUploadOpen } = props;
  const { isElectron, sendToElectron } = useElectronEvent();

  const actionHandler = useCallback((action: Actions) => {
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
  }, [sendToElectron, isElectron]);

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // skip if not electron
      if (!isElectron) return;
      // handle held key
      if (event.repeat) return;

      // check if the ctrl key is pressed
      if (event.ctrlKey) {
        // ctrl + , (settings)
        if (event.key === ',') {
          if (isElectron) {
            // open if not open
            isSettingsOpen ? onSettingsClose() : onSettingsOpen();
          }
        }
      }
    },
    [isElectron, isSettingsOpen, onSettingsClose, onSettingsOpen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <VStack>
      <QuitIconBtn clickHandler={() => actionHandler('shutdown')} />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiMaximize />}
        clickHandler={() => actionHandler('max')}
        tooltip='Show full window'
        aria-label=''
      />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiMinimize />}
        clickHandler={() => actionHandler('min')}
        tooltip='Close to tray'
        aria-label=''
      />
      <div className={style.gap} />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiHelpCircle />}
        clickHandler={() => actionHandler('help')}
        tooltip='Help'
        aria-label=''
      />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<IoSettingsOutline />}
        className={isSettingsOpen ? style.open : ''}
        clickHandler={onSettingsOpen}
        tooltip='Settings'
        isRound
        aria-label=''
      />
      <div className={style.gap} />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiUpload />}
        className={isUploadOpen ? style.open : ''}
        clickHandler={onUploadOpen}
        tooltip='Upload event list'
        isRound
        aria-label=''
      />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiSave />}
        clickHandler={downloadEvents}
        tooltip='Export event list'
        aria-label=''
      />
    </VStack>
  );
}
