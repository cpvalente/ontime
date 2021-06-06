import { useMutation, useQueryClient } from 'react-query';
import { downloadEvents, uploadEventsWithPath } from 'app/api/ontimeApi';
import { EVENTS_TABLE } from 'app/api/apiConstants';
import DownloadIconBtn from './buttons/DownloadIconBtn';
import SettingsIconBtn from './buttons/SettingsIconBtn';
import InfoIconBtn from './buttons/InfoIconBtn';
import MaxIconBtn from './buttons/MaxIconBtn';
import MinIconBtn from './buttons/MinIconBtn';
import QuitIconBtn from './buttons/QuitIconBtn';
import style from './MenuBar.module.css';
import HelpIconBtn from './buttons/HelpIconBtn';
import UploadIconBtn from './buttons/UploadIconBtn';

const { ipcRenderer, remote } = window.require('electron');

export default function MenuBar(props) {
  const { onOpen, onClose } = props;
  const queryClient = useQueryClient();
  const uploaddbPath = useMutation(uploadEventsWithPath, {
    onSettled: () => {
      queryClient.invalidateQueries(EVENTS_TABLE);
    },
  });

  const handleDownload = () => {
    downloadEvents();
  };

  const handleUpload = () => {
    remote.dialog
      .showOpenDialog({
        title: 'Select the File to be uploaded',
        buttonLabel: 'Upload',
        filters: [
          {
            name: 'Text Files',
            extensions: ['json'],
          },
        ],
        // Specifying the File Selector Property
        properties: ['openFile'],
      })
      .then((file) => {
        // Stating whether dialog operation was
        // cancelled or not.
        if (!file.canceled) {
          uploaddbPath.mutate(file.filePaths[0].toString());
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleIPC = (action) => {
    switch (action) {
      case 'min':
        ipcRenderer.send('set-window', 'to-tray');
        break;
      case 'max':
        ipcRenderer.send('set-window', 'to-max');
        break;
      case 'shutdown':
        ipcRenderer.send('shutdown', 'now');
        break;
      case 'help':
        ipcRenderer.send('send-to-link', 'help');
        break;
      default:
        break;
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
      <SettingsIconBtn style={{ fontSize: '1.5em' }} size='lg' disabled />
      <div className={style.gap} />
      <InfoIconBtn
        style={{ fontSize: '1.5em' }}
        size='lg'
        clickhandler={onOpen}
      />
      <UploadIconBtn
        style={{ fontSize: '1.5em' }}
        size='lg'
        clickhandler={handleUpload}
      />
      <DownloadIconBtn
        style={{ fontSize: '1.5em' }}
        size='lg'
        clickhandler={handleDownload}
      />
    </>
  );
}
