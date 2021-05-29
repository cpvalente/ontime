import { downloadEvents } from 'app/api/ontimeApi';
import DownloadIconBtn from './buttons/DownloadIconBtn';
import SettingsIconBtn from './buttons/SettingsIconBtn';
import InfoIconBtn from './buttons/InfoIconBtn';
import MaxIconBtn from './buttons/MaxIconBtn';
import MinIconBtn from './buttons/MinIconBtn';
import QuitIconBtn from './buttons/QuitIconBtn';
import style from './MenuBar.module.css';
import HelpIconBtn from './buttons/HelpIconBtn';

export default function MenuBar(props) {
  const { onOpen, onClose } = props;

  const handleDownload = () => {
    downloadEvents();
  };

  return (
    <>
      <QuitIconBtn size='md' />
      <MaxIconBtn size='md' />
      <MinIconBtn size='md' />
      <div className={style.gap} />
      <HelpIconBtn size='md' disabled />
      <SettingsIconBtn size='md' disabled />
      <InfoIconBtn size='md' clickhandler={onOpen} />
      <DownloadIconBtn size='md' clickhandler={handleDownload} />
    </>
  );
}
