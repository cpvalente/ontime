import { useCallback, useContext, useEffect, useRef } from 'react';
import { VStack } from '@chakra-ui/react';
import { FiDownload } from '@react-icons/all-files/fi/FiDownload';
import { FiHelpCircle } from '@react-icons/all-files/fi/FiHelpCircle';
import { FiMaximize } from '@react-icons/all-files/fi/FiMaximize';
import { FiMinimize } from '@react-icons/all-files/fi/FiMinimize';
import { FiSettings } from '@react-icons/all-files/fi/FiSettings';
import { FiUpload } from '@react-icons/all-files/fi/FiUpload';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EVENTS_TABLE } from 'common/api/apiConstants';
import { downloadEvents, uploadEvents } from 'common/api/ontimeApi';
import PropTypes from 'prop-types';

import QuitIconBtn from '../../common/components/buttons/QuitIconBtn';
import TooltipActionBtn from '../../common/components/buttons/TooltipActionBtn';
import { LoggingContext } from '../../common/context/LoggingContext';

import style from './MenuBar.module.scss';

export default function MenuBar(props) {
  const { isOpen, onOpen, onClose } = props;
  const { emitError } = useContext(LoggingContext);
  const hiddenFileInput = useRef(null);
  const queryClient = useQueryClient();
  const uploaddb = useMutation(uploadEvents, {
    onSettled: () => {
      queryClient.invalidateQueries(EVENTS_TABLE);
    },
  });

  const handleClick = useCallback(() => {
    if (hiddenFileInput && hiddenFileInput.current) {
      hiddenFileInput.current.click();
    }
  }, [hiddenFileInput]);

  const buttonStyle = {
    fontSize: '1.5em',
    size: 'lg',
    colorScheme: 'white',
  };

  const handleUpload = useCallback(
    (event) => {
      const fileUploaded = event.target.files[0];
      if (fileUploaded == null) return;

      // Limit file size to 1MB
      if (fileUploaded.size > 1000000) {
        emitError('Error: File size limit (1MB) exceeded');
        return;
      }

      // Check file extension
      if (fileUploaded.name.endsWith('.xlsx') || fileUploaded.name.endsWith('.json')) {
        try {
          uploaddb.mutate(fileUploaded);
        } catch (error) {
          emitError(`Failed uploading file: ${error}`);
        }
      } else {
        emitError('Error: File type unknown');
      }

      // reset input value
      hiddenFileInput.current.value = '';
    },
    [emitError, uploaddb]
  );

  const handleIPC = useCallback((action) => {
    // Stop crashes when testing locally
    if (typeof window.process?.type === 'undefined') {
      if (action === 'help') {
        window.open('https://cpvalente.gitbook.io/ontime/');
      }
      return;
    }

    if (window.process?.type === 'renderer') {
      switch (action) {
        case 'min':
          window.ipcRenderer.send('set-window', 'to-tray');
          break;
        case 'max':
          window.ipcRenderer.send('set-window', 'to-max');
          break;
        case 'shutdown':
          window.ipcRenderer.send('shutdown', 'now');
          break;
        case 'help':
          window.ipcRenderer.send('send-to-link', 'help');
          break;
        default:
          break;
      }
    }
  }, []);

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback(
    (e) => {
      // handle held key
      if (e.repeat) return;
      // check if the alt key is pressed
      if (e.ctrlKey) {
        if (e.key === ',') {
          // if we are in electron
          if (window.process?.type === undefined) return;
          if (window.process.type === 'renderer') {
            // open if not open
            isOpen ? onClose() : onOpen();
          }
        }
      }
    },
    [isOpen, onClose, onOpen]
  );

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <VStack>
      <QuitIconBtn clickHandler={() => handleIPC('shutdown')} />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiMaximize />}
        clickHandler={() => handleIPC('max')}
        tooltip='Show full window'
      />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiMinimize />}
        clickHandler={() => handleIPC('min')}
        tooltip='Close to tray'
      />
      <div className={style.gap} />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiHelpCircle />}
        clickHandler={() => handleIPC('help')}
        tooltip='Help'
      />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiSettings />}
        className={isOpen ? style.open : ''}
        clickHandler={onOpen}
        tooltip='Settings'
        isRound
      />
      <div className={style.gap} />
      <input
        type='file'
        style={{ display: 'none' }}
        ref={hiddenFileInput}
        onChange={handleUpload}
        accept='.json, .xlsx'
      />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiUpload />}
        clickHandler={handleClick}
        tooltip='Import event list'
      />
      <TooltipActionBtn
        {...buttonStyle}
        icon={<FiDownload />}
        clickHandler={downloadEvents}
        tooltip='Export event list'
      />
    </VStack>
  );
}

MenuBar.propTypes = {
  isOpen: PropTypes.bool,
  onOpen: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
