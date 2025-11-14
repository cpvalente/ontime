import { lazy } from 'react';
import { IoArrowDown, IoArrowUp, IoBan, IoTime } from 'react-icons/io5';
import { LuArrowDownToLine } from 'react-icons/lu';
import { TimerPhase, TimerType } from 'ontime-types';

import { CornerWithPip } from '../../../common/components/editor-utils/EditorUtils';
import Tooltip from '../../../common/components/tooltip/Tooltip';
import { useMessagePreview } from '../../../common/hooks/useSocket';
import useViewSettings from '../../../common/hooks-query/useViewSettings';
import { handleLinks } from '../../../common/utils/linkUtils';
import { cx, timerPlaceholder } from '../../../common/utils/styleUtils';

const PipTimerHost = lazy(() => import('../../../views/editor/pip-timer/PipTimer'));

import style from './MessageControl.module.scss';

const secondarySourceLabels: Record<string, string> = {
  aux1: 'Aux 1',
  aux2: 'Aux 2',
  aux3: 'Aux 3',
  secondary: 'Secondary message',
};

export default function TimerPreview() {
  const { blink, blackout, countToEnd, phase, secondarySource, showTimerMessage, timerType } = useMessagePreview();
  const { data } = useViewSettings();

  const main = (() => {
    if (showTimerMessage) return 'Message';
    if (timerType === TimerType.None) return timerPlaceholder;
    if (phase === TimerPhase.Pending) return 'Standby to start';
    if (phase === TimerPhase.Overtime) return 'Timer Overtime';
    if (timerType === TimerType.Clock) return 'Clock';
    if (countToEnd) return 'Count to End';
    return 'Timer';
  })();

  const secondary = (() => {
    // message is a fullscreen overlay or secondary is not active
    if (showTimerMessage || !secondarySource) return null;

    // we need to check aux first since it takes priority
    return secondarySourceLabels[secondarySource];
  })();

  const overrideColour = (() => {
    // override fallback colours from starter project
    if (phase === TimerPhase.Warning) return data.warningColor ?? '#ffa528';
    if (phase === TimerPhase.Danger) return data.dangerColor ?? '#ff7300';
    return data.normalColor ?? '#FFFC';
  })();

  const showColourOverride = main == 'Timer';
  const contentClasses = cx([blink && style.blink, blackout && style.blackout]);

  return (
    <div className={style.preview}>
      <CornerWithPip onExtractClick={(event) => handleLinks('timer', event)} pipElement={<PipTimerHost />} />
      <div className={contentClasses}>
        <div
          className={style.mainContent}
          data-phase={showColourOverride && phase}
          style={showColourOverride ? { '--override-colour': overrideColour } : {}}
        >
          {main}
        </div>
        {secondary !== null && <div className={style.secondaryContent}>{secondary}</div>}
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
