import { useContext } from 'react';
import { Divider, Tooltip } from '@chakra-ui/react';
import { IoContract } from '@react-icons/all-files/io5/IoContract';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';
import { IoLocate } from '@react-icons/all-files/io5/IoLocate';
import { IoMoon } from '@react-icons/all-files/io5/IoMoon';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';
import { EventData, Playback } from 'ontime-types';
import { formatDisplay } from 'ontime-utils';

import { TableSettingsContext } from '../../../common/context/TableSettingsContext';
import useFullscreen from '../../../common/hooks/useFullscreen';
import { useTimer } from '../../../common/hooks/useSocket';
import useEventData from '../../../common/hooks-query/useEventData';
import { formatTime } from '../../../common/utils/time';
import { tooltipDelayFast } from '../../../ontimeConfig';

import PlaybackIcon from '../tableElements/PlaybackIcon';

import style from './TableHeader.module.scss';

interface TableHeaderProps {
  handleCSVExport: (headerData: EventData) => void;
  featureData: {
    playback: Playback;
    selectedEventIndex: number | null;
    numEvents: number;
    titleNow: string | null;
  };
}

export default function TableHeader({ handleCSVExport, featureData }: TableHeaderProps) {
  const { followSelected, showSettings, toggleTheme, toggleSettings, toggleFollow } = useContext(TableSettingsContext);
  const timer = useTimer();
  const { isFullScreen, toggleFullScreen } = useFullscreen();
  const { data: event } = useEventData();

  const exportCsv = () => {
    if (event) {
      handleCSVExport(event);
    }
  };

  const selected = !featureData.numEvents
    ? 'No events'
    : `Event ${featureData.selectedEventIndex != null ? featureData.selectedEventIndex + 1 : '-'}/${
        featureData.numEvents ? featureData.numEvents : '-'
      }`;

  // prepare presentation variables
  const isOvertime = (timer.current ?? 0) < 0;
  const timerNow = timer.current == null ? '-' : `${isOvertime ? '-' : ''}${formatDisplay(timer.current)}`;
  const timeNow = formatTime(timer.clock, {
    showSeconds: true,
    format: 'hh:mm:ss a',
  });

  return (
    <div className={style.header}>
      <div className={style.event}>
        <div className={style.title}>{event?.title || '-'}</div>
        <div className={style.eventNow}>{featureData?.titleNow || '-'}</div>
      </div>
      <div className={style.playback}>
        <div className={style.playbackLabel}>{selected}</div>
        <PlaybackIcon state={featureData.playback} />
      </div>
      <div className={style.timer}>
        <div className={style.timerLabel}>Running Timer</div>
        <div className={style.value}>{timerNow}</div>
      </div>
      <div className={style.clock}>
        <div className={style.clockLabel}>Time Now</div>
        <div className={style.value}>{timeNow}</div>
      </div>
      <div className={style.headerActions}>
        <Tooltip openDelay={tooltipDelayFast} label='Follow selected'>
          <span onClick={() => toggleFollow()} className={followSelected ? style.actionIcon : style.actionDisabled}>
            <IoLocate />
          </span>
        </Tooltip>
        <Tooltip openDelay={tooltipDelayFast} label='Show settings'>
          <span onClick={() => toggleSettings()} className={showSettings ? style.actionIcon : style.actionDisabled}>
            <IoSettingsOutline />
          </span>
        </Tooltip>
        <Tooltip openDelay={tooltipDelayFast} label='Toggle dark mode'>
          <span onClick={() => toggleTheme()} className={style.actionIcon}>
            <IoMoon />
          </span>
        </Tooltip>
        <Tooltip openDelay={tooltipDelayFast} label='Toggle Fullscreen'>
          <span onClick={() => toggleFullScreen()} className={style.actionIcon}>
            {isFullScreen ? <IoContract /> : <IoExpand />}
          </span>
        </Tooltip>
        <Divider />
        <Tooltip openDelay={tooltipDelayFast} label='Export to CSV'>
          <span className={style.actionIcon} onClick={exportCsv}>
            CSV
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
