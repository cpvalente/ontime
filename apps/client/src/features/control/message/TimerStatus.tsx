import { TimerType } from 'ontime-types';
import { IoArrowDown, IoArrowUp, IoBan, IoTime } from 'react-icons/io5';
import { LuArrowDownToLine } from 'react-icons/lu';

import Tooltip from '../../../common/components/tooltip/Tooltip';
import { useTimerStatus } from '../../../common/hooks/useSocket';

import style from './TimerStatus.module.scss';

/** Read only summary of how the loaded event drives the stage timer */
export default function TimerStatus() {
  const { countToEnd, timerType } = useTimerStatus();

  return (
    <div className={style.timerStatus}>
      <Tooltip
        text='Time type: Count down'
        render={<span />}
        className={style.statusIcon}
        data-active={timerType === TimerType.CountDown}
      >
        <IoArrowDown />
      </Tooltip>
      <Tooltip
        text='Time type: Count up'
        render={<span />}
        className={style.statusIcon}
        data-active={timerType === TimerType.CountUp}
      >
        <IoArrowUp />
      </Tooltip>
      <Tooltip
        text='Time type: Clock'
        render={<span />}
        className={style.statusIcon}
        data-active={timerType === TimerType.Clock}
      >
        <IoTime />
      </Tooltip>
      <Tooltip
        text='Time type: None'
        render={<span />}
        className={style.statusIcon}
        data-active={timerType === TimerType.None}
      >
        <IoBan />
      </Tooltip>
      <Tooltip
        text={countToEnd ? 'Count to end' : 'Count duration'}
        render={<span />}
        className={style.statusIcon}
        data-active={countToEnd}
      >
        <LuArrowDownToLine />
      </Tooltip>
    </div>
  );
}
