import { Tooltip } from '@chakra-ui/react';
import { IoArrowDown } from '@react-icons/all-files/io5/IoArrowDown';
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp';
import { IoFlag } from '@react-icons/all-files/io5/IoFlag';
import { IoTime } from '@react-icons/all-files/io5/IoTime';
import { TimerPhase, TimerType } from 'ontime-types';

import { useMessagePreview } from '../../../common/hooks/useSocket';
import useViewSettings from '../../../common/hooks-query/useViewSettings';
import { handleLinks } from '../../../common/utils/linkUtils';
import { cx } from '../../../common/utils/styleUtils';
import { tooltipDelayMid } from '../../../ontimeConfig';

import style from './MessageControl.module.scss';

export default function TimerPreview() {
  const { blink, blackout, phase, showAuxTimer, showExternalMessage, showTimerMessage, timerType } =
    useMessagePreview();
  const { data } = useViewSettings();

  const contentClasses = cx([style.previewContent, blink && style.blink, blackout && style.blackout]);

  const main = (() => {
    if (showTimerMessage) return 'Message';
    if (phase === TimerPhase.Pending) return 'Standby to start';
    if (phase === TimerPhase.Overtime && data.endMessage) return 'Custom end message';
    return 'Timer';
  })();

  const secondary = (() => {
    // message is a fullscreen overlay
    if (showTimerMessage) return null;

    // we need to check aux first since it takes priority
    if (showAuxTimer) return 'Aux Timer';
    if (showExternalMessage) return 'External message';
    return null;
  })();

  const overrideColour = (() => {
    // override fallback colours from starter project
    if (phase === TimerPhase.Warning) return data.warningColor ?? '#FFAB33';
    if (phase === TimerPhase.Danger) return data.dangerColor ?? '#ED3333';
    return data.normalColor ?? '#FFFC';
  })();

  const showColourOverride = main == 'Timer';

  return (
    <div className={style.preview}>
      <IoArrowUp className={style.corner} onClick={(event) => handleLinks(event, 'timer')} />
      <div className={contentClasses}>
        <div
          className={style.mainContent}
          data-phase={phase}
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
        <Tooltip label='Time type: Time to end' openDelay={tooltipDelayMid} shouldWrapChildren>
          <IoFlag className={style.statusIcon} data-active={timerType === TimerType.TimeToEnd} />
        </Tooltip>
      </div>
    </div>
  );
}
