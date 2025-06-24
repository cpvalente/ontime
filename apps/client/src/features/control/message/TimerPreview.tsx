import { IoArrowDown, IoArrowUp, IoBan, IoFlag, IoTime } from 'react-icons/io5';
import { Tooltip } from '@chakra-ui/react';
import { TimerPhase, TimerType } from 'ontime-types';

import { Corner } from '../../../common/components/editor-utils/EditorUtils';
import { useMessagePreview } from '../../../common/hooks/useSocket';
import useViewSettings from '../../../common/hooks-query/useViewSettings';
import { handleLinks } from '../../../common/utils/linkUtils';
import { cx, timerPlaceholder } from '../../../common/utils/styleUtils';
import { tooltipDelayMid } from '../../../ontimeConfig';

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
    if (phase === TimerPhase.Overtime && data.endMessage) return 'Custom end message';
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
    if (phase === TimerPhase.Warning) return data.warningColor ?? '#FFAB33';
    if (phase === TimerPhase.Danger) return data.dangerColor ?? '#ED3333';
    return data.normalColor ?? '#FFFC';
  })();

  const showColourOverride = main == 'Timer';
  const contentClasses = cx([blink && style.blink, blackout && style.blackout]);

  return (
    <div className={style.preview}>
      <Corner onClick={(event) => handleLinks('timer', event)} />
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
        <Tooltip label='Time type: Count down' openDelay={tooltipDelayMid} shouldWrapChildren>
          <IoArrowDown className={style.statusIcon} data-active={timerType === TimerType.CountDown} />
        </Tooltip>
        <Tooltip label='Time type: Count up' openDelay={tooltipDelayMid} shouldWrapChildren>
          <IoArrowUp className={style.statusIcon} data-active={timerType === TimerType.CountUp} />
        </Tooltip>
        <Tooltip label='Time type: Clock' openDelay={tooltipDelayMid} shouldWrapChildren>
          <IoTime className={style.statusIcon} data-active={timerType === TimerType.Clock} />
        </Tooltip>
        <Tooltip label='Time type: None' openDelay={tooltipDelayMid} shouldWrapChildren>
          <IoBan className={style.statusIcon} data-active={timerType === TimerType.None} />
        </Tooltip>
        <Tooltip label={countToEnd ? 'Count to end' : 'Count duration'} openDelay={tooltipDelayMid} shouldWrapChildren>
          <IoFlag className={style.statusIcon} data-active={countToEnd} />
        </Tooltip>
      </div>
    </div>
  );
}
