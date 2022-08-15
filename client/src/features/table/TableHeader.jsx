import React, { useContext } from 'react';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiSettings } from '@react-icons/all-files/fi/FiSettings';
import { FiTarget } from '@react-icons/all-files/fi/FiTarget';
import { IoMoon } from '@react-icons/all-files/io5/IoMoon';
import PropTypes from 'prop-types';

import { EVENT_TABLE } from '../../common/api/apiConstants';
import { fetchEvent } from '../../common/api/eventApi';
import { TableSettingsContext } from '../../common/context/TableSettingsContext';
import { useFetch } from '../../common/hooks/useFetch';
import { useTimerProvider } from '../../common/hooks/useSocketProvider';
import { stringFromMillis } from '../../common/utils/time';

import PlaybackIcon from './tableElements/PlaybackIcon';

import style from './Table.module.scss';

export default function TableHeader({ featureData }) {
  const { followSelected, showSettings, toggleTheme, toggleSettings, toggleFollow } =
    useContext(TableSettingsContext);
  const timer = useTimerProvider();

  const { data: event } = useFetch(EVENT_TABLE, fetchEvent);

  const selected = !featureData.numEvents
    ? 'No events'
    : `Event ${featureData.selectedEventIndex != null ? featureData.selectedEventIndex + 1 : '-'}/${
        featureData.numEvents ? featureData.numEvents : '-'
      }`;

  return (
    <div className={style.header}>
      <div className={style.headerName}>{event?.title || ''}</div>
      <div className={style.headerNow}>{featureData.titleNow}</div>
      <div className={style.headerPlayback}>
        <span className={style.label}>{selected}</span>
        <br />
        <PlaybackIcon state={featureData.playback} />
      </div>
      <div className={style.headerRunning}>
        <span className={style.label}>Running Timer</span>
        <br />
        <span className={style.timer}>{stringFromMillis(timer.current)}</span>
      </div>
      <div className={style.headerClock}>
        <span className={style.label}>Time Now</span>
        <br />
        <span className={style.timer}>{stringFromMillis(timer.clock)}</span>
      </div>
      <div className={style.headerActions}>
        <Tooltip openDelay={300} label='Follow selected'>
          <span className={followSelected ? style.actionIcon : style.actionDisabled}>
            <FiTarget onClick={() => toggleFollow()} />
          </span>
        </Tooltip>
        <Tooltip openDelay={300} label='Show settings'>
          <span className={showSettings ? style.actionIcon : style.actionDisabled}>
            <FiSettings onClick={() => toggleSettings()} />
          </span>
        </Tooltip>
        <Tooltip openDelay={300} label='Toggle dark mode'>
          <span className={style.actionIcon}>
            <IoMoon onClick={() => toggleTheme()} />
          </span>
        </Tooltip>
      </div>
    </div>
  );
}

TableHeader.propTypes = {
  featureData: PropTypes.shape({
    playback: PropTypes.string,
    selectedEventId: PropTypes.string,
    selectedEventIndex: PropTypes.string,
    numEvents: PropTypes.number,
    titleNow: PropTypes.string,
  }),
};

