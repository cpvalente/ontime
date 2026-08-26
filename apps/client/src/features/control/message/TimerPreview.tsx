import { TimerType } from 'ontime-types';
import { IoArrowDown, IoArrowUp, IoBan, IoTime } from 'react-icons/io5';
import { LuArrowDownToLine } from 'react-icons/lu';

import { CornerWithPip } from '../../../common/components/editor-utils/EditorUtils';
import Tooltip from '../../../common/components/tooltip/Tooltip';
import useViewSettings from '../../../common/hooks-query/useViewSettings';
import { useMessagePreview } from '../../../common/hooks/useSocket';
import { handleLinks } from '../../../common/utils/linkUtils';
import PipRoot from '../../../views/editor/pip-timer/PipRoot';
import { PipTimer } from '../../../views/editor/pip-timer/PipTimer';

import style from './TimerPreview.module.scss';

export default function TimerPreview() {
  const { countToEnd, timerType } = useMessagePreview();
  const { data } = useViewSettings();

  return (
    <div className={style.preview}>
      <div className={style.stageFrame}>
        <PipTimer viewSettings={data} />
        <div className={style.stageCorners}>
          <CornerWithPip onExtractClick={(event) => handleLinks('timer', event)} pipElement={<PipRoot />} />
        </div>
      </div>
      <div className={style.eventStatus}>
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
    </div>
  );
}
