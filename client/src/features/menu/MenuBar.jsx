import { downloadEvents } from 'app/api/ontimeApi';
import DownloadIconBtn from './buttons/DownloadIconBtn';
import SettingsIconBtn from './buttons/SettingsIconBtn';
import InfoIconBtn from './buttons/InfoIconBtn';
import MaxIconBtn from './buttons/MaxIconBtn';
import MinIconBtn from './buttons/MinIconBtn';
import QuitIconBtn from './buttons/QuitIconBtn';
import style from './MenuBar.module.css';
import HelpIconBtn from './buttons/HelpIconBtn';
const { ipcRenderer } = window.require('electron');

export default function MenuBar(props) {
  const { onOpen, onClose } = props;

  const handleDownload = () => {
    downloadEvents();
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
      <InfoIconBtn
        style={{ fontSize: '1.5em' }}
        size='lg'
        clickhandler={onOpen}
      />
      <DownloadIconBtn
        style={{ fontSize: '1.5em' }}
        size='lg'
        clickhandler={handleDownload}
      />
    </>
  );
}
