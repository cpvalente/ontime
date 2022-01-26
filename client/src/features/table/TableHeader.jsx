import style from './Table.module.scss';
import { useFetch } from '../../app/hooks/useFetch';
import { EVENT_TABLE } from '../../app/api/apiConstants';
import { fetchEvent } from '../../app/api/eventApi';
import { FiDownload } from '@react-icons/all-files/fi/FiDownload';
import { FiSettings } from '@react-icons/all-files/fi/FiSettings';
import { FiTarget } from '@react-icons/all-files/fi/FiTarget';
import { FiPrinter } from '@react-icons/all-files/fi/FiPrinter';
import { IoMoon } from '@react-icons/all-files/io5/IoMoon';
import { IoReload } from '@react-icons/all-files/io5/IoReload';
import { useSocket } from '../../app/context/socketContext';
import { useEffect, useState } from 'react';
import { stringFromMillis } from 'ontime-utils/time';
import { formatDisplay } from '../../common/utils/dateConfig';

export default function TableHeader(props) {
  const { setDark, setShowSettings, now } = props;
  const { data, status, refetch } = useFetch(EVENT_TABLE, fetchEvent);

  const socket = useSocket();
  const [timer, setTimer] = useState({
    clock: null,
    running: null,
    startedAt: null,
    expectedFinish: null,
    secondary: null,
  });

  // handle incoming messages
  useEffect(() => {
    if (socket == null) return;

    socket.emit('get-timer');

    // Handle timer
    socket.on('timer', (data) => {
      setTimer(data);
    });

    // Clear listener
    return () => {
      socket.off('timer');
    };
  }, [socket]);

  return (
    <div className={style.header}>
      <div className={style.headerName}>{data?.title || ''}</div>
      <div className={style.headerNow}>{now}</div>
      <div className={style.headerRunning}>
        <span className={style.label}>Running Timer</span>
        <br />
        <span className={style.timer}>{formatDisplay(timer.running)}</span>
      </div>
      <div className={style.headerClock}>
        <span className={style.label}>Time Now</span>
        <br />
        <span className={style.timer}>{stringFromMillis(timer.clock)}</span>
      </div>
      <div className={style.headerActions}>
        <FiTarget />
        <IoReload />
        <FiDownload />
        <FiPrinter />
        <FiSettings onClick={() => setShowSettings((prev) => !prev)} />
        <IoMoon onClick={() => setDark((prev) => !prev)} />
      </div>
    </div>
  );
}
