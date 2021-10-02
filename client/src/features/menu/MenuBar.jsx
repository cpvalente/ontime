import { useMutation, useQueryClient } from 'react-query';
import { downloadEvents, uploadEvents } from 'app/api/ontimeApi';
import { EVENTS_TABLE } from 'app/api/apiConstants';
import DownloadIconBtn from './buttons/DownloadIconBtn';
import SettingsIconBtn from './buttons/SettingsIconBtn';
import MaxIconBtn from './buttons/MaxIconBtn';
import MinIconBtn from './buttons/MinIconBtn';
import QuitIconBtn from './buttons/QuitIconBtn';
import style from './MenuBar.module.css';
import HelpIconBtn from './buttons/HelpIconBtn';
import UploadIconBtn from './buttons/UploadIconBtn';
import { useRef } from 'react';

export default function MenuBar(props) {
  const { onOpen } = props;
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

  const handleUpload = (event) => {
    const fileUploaded = event.target.files[0];

    if (fileUploaded == null) return;

    try {
      uploaddb.mutate(fileUploaded);
    } catch (error) {
      console.log(error);
    }
  };

  const handleIPC = (action) => {
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
        style={{ fontSize: '1.5em' }}
        size='lg'
        clickhandler={() => handleIPC('max')}
      />
      <MinIconBtn
        style={{ fontSize: '1.5em' }}
        size='lg'
        clickhandler={() => handleIPC('min')}
      />
      <div className={style.gap} />
      <HelpIconBtn
        style={{ fontSize: '1.5em' }}
        size='lg'
        clickhandler={() => handleIPC('help')}
      />
      <SettingsIconBtn
        style={{ fontSize: '1.5em' }}
        size='lg'
        clickhandler={onOpen}
      />
      <div className={style.gap} />
      <input
        type='file'
        style={{ display: 'none' }}
        ref={hiddenFileInput}
        onChange={handleUpload}
        accept='.json'
      />
      <UploadIconBtn
        style={{ fontSize: '1.5em' }}
        size='lg'
        clickhandler={handleClick}
      />
      <DownloadIconBtn
        style={{ fontSize: '1.5em' }}
        size='lg'
        clickhandler={handleDownload}
      />
    </>
  );
}
