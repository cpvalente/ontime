import React, { useContext, useRef } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { downloadEvents, uploadEvents } from 'app/api/ontimeApi';
import { EVENTS_TABLE } from 'app/api/apiConstants';
import DownloadIconBtn from './buttons/DownloadIconBtn';
import SettingsIconBtn from './buttons/SettingsIconBtn';
import MaxIconBtn from './buttons/MaxIconBtn';
import MinIconBtn from './buttons/MinIconBtn';
import QuitIconBtn from './buttons/QuitIconBtn';
import style from './MenuBar.module.scss';
import HelpIconBtn from './buttons/HelpIconBtn';
import UploadIconBtn from './buttons/UploadIconBtn';
import { LoggingContext } from '../../app/context/LoggingContext';
import PropTypes from 'prop-types';

export default function MenuBar(props) {
  const { isOpen, onOpen } = props;
  const { emitError } = useContext(LoggingContext);
  const hiddenFileInput = useRef(null);
  const queryClient = useQueryClient();
  const uploaddb = useMutation(uploadEvents, {
    onSettled: () => {
      queryClient.invalidateQueries(EVENTS_TABLE);
    },
  });

  const handleDownload = () => {
    downloadEvents();
  };

  const handleClick = () => {
    if (hiddenFileInput && hiddenFileInput.current) {
      hiddenFileInput.current.click();
    }
  };

  const buttonStyle = {
    fontSize: '1.5em'
  };

  const handleUpload = (event) => {
    const fileUploaded = event.target.files[0];
    console.log('1', fileUploaded)
    if (fileUploaded == null) return;

    // Limit file size to 1MB
    if (fileUploaded.size > 1000000) {
      emitError('Error: File size limit (1MB) exceeded')
      return;
    }

    console.log('2', ! fileUploaded.name.endsWith('.xlsx')
      || !fileUploaded.name.endsWith('.json'))

    // Check file extension
    if (fileUploaded.name.endsWith('.xlsx') || fileUploaded.name.endsWith('.json')) {
      try {
        uploaddb.mutate(fileUploaded);
      } catch (error) {
        emitError(`Failed uploading file: ${error}`)
      }
    } else {
      emitError('Error: File type unknown')
    }

    // reset input value
    hiddenFileInput.current.value = '';
  };

  const handleIPC = (action) => {
    // Stop crashes when testing locally
    if (window.process?.type === undefined) {
      if (action === 'help') {
        window.open('https://cpvalente.gitbook.io/ontime/');
      }
      return;
    }

    if (window.process.type === 'renderer') {
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
  };

  return (
    <>
      <QuitIconBtn size='lg' clickhandler={() => handleIPC('shutdown')} />
      <MaxIconBtn
        style={{ ...buttonStyle }}
        size='lg'
        clickhandler={() => handleIPC('max')}
      />
      <MinIconBtn
        style={{ ...buttonStyle }}
        size='lg'
        clickhandler={() => handleIPC('min')}
      />
      <div className={style.gap} />
      <HelpIconBtn
        style={{ ...buttonStyle }}
        size='lg'
        clickhandler={() => handleIPC('help')}
      />
      <SettingsIconBtn
        style={{...buttonStyle}}
        size='lg'
        className={isOpen ? style.open : ''}
        clickhandler={onOpen}
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
      <UploadIconBtn
        style={{ ...buttonStyle }}
        size='lg'
        clickhandler={handleClick}
      />
      <DownloadIconBtn
        style={{ ...buttonStyle }}
        size='lg'
        clickhandler={handleDownload}
      />
    </>
  );
}

MenuBar.propTypes = {
  isOpen: PropTypes.bool,
  onOpen: PropTypes.func.isRequired,
};

