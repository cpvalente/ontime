import React, { useContext, useEffect, useState } from 'react';
import { Divider } from '@chakra-ui/layout';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiSettings } from '@react-icons/all-files/fi/FiSettings';
import { FiTarget } from '@react-icons/all-files/fi/FiTarget';
import { IoContract } from '@react-icons/all-files/io5/IoContract';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';
import { IoMoon } from '@react-icons/all-files/io5/IoMoon';
import PropTypes from 'prop-types';

import { EVENT_TABLE } from '../../common/api/apiConstants';
import { fetchEvent } from '../../common/api/eventApi';
import { useSocket } from '../../common/context/socketContext';
import { TableSettingsContext } from '../../common/context/TableSettingsContext';
import { useFetch } from '../../common/hooks/useFetch';
import useFullscreen from '../../common/hooks/useFullscreen';
import { formatDisplay } from '../../common/utils/dateConfig';
import { formatTime } from '../../common/utils/time';
import { tooltipDelayFast } from '../../ontimeConfig';

import PlaybackIcon from './tableElements/PlaybackIcon';

import style from './Table.module.scss';

export default function TableHeader({ handleCSVExport }) {
  const { followSelected, showSettings, toggleTheme, toggleSettings, toggleFollow } =
    useContext(TableSettingsContext);
  const { data } = useFetch(EVENT_TABLE, fetchEvent);
  const { isFullScreen, toggleFullScreen } = useFullscreen();

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

  const [playback, setPlayback] = useState('');
  const [selected, setSelected] = useState('');

  /**
   * Handle incoming data from socket
   */
  useEffect(() => {
    if (socket == null) return;

    // Ask for titles
    socket.emit('get-titles');

    // Ask for timer
    socket.emit('get-timer');

    // Ask for playback state
    socket.emit('get-playstate');

    // Handle titles
    socket.on('titles', (data) => {
      setTitles(data);
    });

    // Handle timer
    socket.on('timer', (data) => {
      setTimer(data);
    });

    // Handle playstate
    socket.on('playstate', (data) => {
      setPlayback(data);
    });

    // Handle selection data
    socket.on('selected', (data) => {
      if (data.total === 0 || data.total == null) {
        setSelected('');
      } else {
        const formattedCurrent = `${data.index != null ? data.index + 1 : '-'}/${
          data.total ? data.total : '-'
        }`;
        setSelected(formattedCurrent);
      }
    });

    // Clear listener
    return () => {
      socket.off('titles');
      socket.off('timer');
      socket.off('playstate');
      socket.off('selected');
    };
  }, [socket]);

  // prepare presentation variables
  const timerNow = `${timer.running < 0 ? '-' : ''}${formatDisplay(timer.running)}`;
  const timeNow = formatTime(timer.clock, {
    showSeconds: true,
    format: 'hh:mm:ss a',
  });

  return (
    <div className={style.header}>
      <div className={style.headerName}>{data?.title || ''}</div>
      <div className={style.headerNow}>{titles.titleNow}</div>
      <div className={style.headerPlayback}>
        <span className={style.label}>{selected}</span>
        <br />
        <PlaybackIcon state={playback} />
      </div>
      <div className={style.headerRunning}>
        <span className={style.label}>Running Timer</span>
        <br />
        <span className={style.timer}>{timerNow}</span>
      </div>
      <div className={style.headerClock}>
        <span className={style.label}>Time Now</span>
        <br />
        <span className={style.timer}>{timeNow}</span>
      </div>
      <div className={style.headerActions}>
        <Tooltip openDelay={tooltipDelayFast} label='Follow selected'>
          <span className={followSelected ? style.actionIcon : style.actionDisabled}>
            <FiTarget onClick={() => toggleFollow()} />
          </span>
        </Tooltip>
        <Tooltip openDelay={tooltipDelayFast} label='Show settings'>
          <span className={showSettings ? style.actionIcon : style.actionDisabled}>
            <FiSettings onClick={() => toggleSettings()} />
          </span>
        </Tooltip>
        <Tooltip openDelay={tooltipDelayFast} label='Toggle dark mode'>
          <span className={style.actionIcon}>
            <IoMoon onClick={() => toggleTheme()} />
          </span>
        </Tooltip>
        <Tooltip openDelay={tooltipDelayFast} label='Toggle Fullscreen'>
          <span className={style.actionIcon}>
            {isFullScreen ? (
              <IoContract onClick={() => toggleFullScreen()} />
            ) : (
              <IoExpand onClick={() => toggleFullScreen()} />
            )}
          </span>
        </Tooltip>
        <Divider />
        <Tooltip openDelay={tooltipDelayFast} label='Export to CSV'>
          <span className={style.actionText} onClick={() => handleCSVExport(data)}>
            CSV
          </span>
        </Tooltip>
      </div>
    </div>
  );
}

TableHeader.propTypes = {
  handleCSVExport: PropTypes.func.isRequired,
};
