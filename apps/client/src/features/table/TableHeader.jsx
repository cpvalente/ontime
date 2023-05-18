import { useContext } from 'react';
import { Divider, Tooltip } from '@chakra-ui/react';
import { FiSettings } from '@react-icons/all-files/fi/FiSettings';
import { FiTarget } from '@react-icons/all-files/fi/FiTarget';
import { IoContract } from '@react-icons/all-files/io5/IoContract';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';
import { IoMoon } from '@react-icons/all-files/io5/IoMoon';
import PropTypes from 'prop-types';

import { TableSettingsContext } from '../../common/context/TableSettingsContext';
import useFullscreen from '../../common/hooks/useFullscreen';
import { useTimer } from '../../common/hooks/useSocket';
import useEventData from '../../common/hooks-query/useEventData';
import { formatDisplay } from '../../common/utils/dateConfig';
import { formatTime } from '../../common/utils/time';
import { tooltipDelayFast } from '../../ontimeConfig';

import PlaybackIcon from './tableElements/PlaybackIcon';

import style from './Table.module.scss';

export default function TableHeader({ handleCSVExport, featureData }) {
  const { followSelected, showSettings, toggleTheme, toggleSettings, toggleFollow } = useContext(TableSettingsContext);
  const timer = useTimer();
  const { isFullScreen, toggleFullScreen } = useFullscreen();
  const { data: event } = useEventData();

  const selected = !featureData.numEvents
    ? 'No events'
    : `Event ${featureData.selectedEventIndex != null ? featureData.selectedEventIndex + 1 : '-'}/${
        featureData.numEvents ? featureData.numEvents : '-'
      }`;

  // prepare presentation variables
  const isOvertime = timer.current < 0;
  const timerNow = `${isOvertime ? '-' : ''}${formatDisplay(timer.current)}`;
  const timeNow = formatTime(timer.clock, {
    showSeconds: true,
    format: 'hh:mm:ss a',
  });

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
          <span className={style.actionText} onClick={() => handleCSVExport(event)}>
            CSV
          </span>
        </Tooltip>
      </div>
    </div>
  );
}

TableHeader.propTypes = {
  handleCSVExport: PropTypes.func.isRequired,
  featureData: PropTypes.shape({
    playback: PropTypes.string,
    selectedEventId: PropTypes.string,
    selectedEventIndex: PropTypes.number,
    numEvents: PropTypes.number,
    titleNow: PropTypes.string,
  }),
};
