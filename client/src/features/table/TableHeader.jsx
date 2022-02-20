import React, { useEffect, useState } from 'react';
import { useFetch } from '../../app/hooks/useFetch';
import { EVENT_TABLE } from '../../app/api/apiConstants';
import { fetchEvent } from '../../app/api/eventApi';
import { FiDownload } from '@react-icons/all-files/fi/FiDownload';
import { FiSettings } from '@react-icons/all-files/fi/FiSettings';
import { FiTarget } from '@react-icons/all-files/fi/FiTarget';
import { FiPrinter } from '@react-icons/all-files/fi/FiPrinter';
import { IoMoon } from '@react-icons/all-files/io5/IoMoon';
import { IoReload } from '@react-icons/all-files/io5/IoReload';
import { FiSave } from '@react-icons/all-files/fi/FiSave';
import { useSocket } from '../../app/context/socketContext';
import { stringFromMillis } from 'ontime-utils/time';
import { formatDisplay } from '../../common/utils/dateConfig';
import PropTypes from 'prop-types';
import { Tooltip } from '@chakra-ui/tooltip';
import style from './Table.module.scss';

export default function TableHeader(props) {
  const { setDark, setShowSettings } = props;
  const { data } = useFetch(EVENT_TABLE, fetchEvent);

  const socket = useSocket();
  const [timer, setTimer] = useState({
    clock: null,
    running: null,
    startedAt: null,
    expectedFinish: null,
    secondary: null,
  });

  const [titles, setTitles] = useState({
    titleNow: '',
    subtitleNow: '',
    presenterNow: '',
    noteNow: '',
    titleNext: '',
    subtitleNext: '',
    presenterNext: '',
    noteNext: '',
  });

  /**
   * Handle incoming data from socket
   */
  useEffect(() => {
    if (socket == null) return;

    // Ask for titles
    socket.emit('get-titles');

    // Ask for timer
    socket.emit('get-timer');

    // Handle titles
    socket.on('titles', (data) => {
      setTitles(data);
    });

    // Handle timer
    socket.on('timer', (data) => {
      setTimer(data);
    });

    // Clear listener
    return () => {
      socket.off('titles');
      socket.off('timer');
    };
  }, [socket]);

  return (
    <div className={style.header}>
      <div className={style.headerName}>{data?.title || ''}</div>
      <div className={style.headerNow}>{titles.titleNow}</div>
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
        <span style={{ paddingRight: '4px' }} />
        <Tooltip openDelay={300} label='Show settings'>
          <span className={style.actionIcon}>
            <FiSettings onClick={() => setShowSettings((prev) => !prev)} />
          </span>
        </Tooltip>
        <Tooltip openDelay={300} label='Toggle dark mode'>
          <span className={style.actionIcon}>
            <IoMoon onClick={() => setDark()} />
          </span>
        </Tooltip>
      </div>
    </div>
  );
}

TableHeader.propTypes = {
  // set follow
  refetchEvents: PropTypes.func.isRequired,
  // save needs a mutation
  // download events
  setShowSettings: PropTypes.func.isRequired,
  setDark: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
