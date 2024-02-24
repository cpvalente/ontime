import { memo, RefObject, SyntheticEvent } from 'react';

import DelayIndicator from '../../../common/components/delay-indicator/DelayIndicator';
import useLongPress from '../../../common/hooks/useLongPress';
import { useTimer } from '../../../common/hooks/useSocket';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import ClockTime from '../../viewers/common/clock-time/ClockTime';
import RunningTime from '../../viewers/common/running-time/RunningTime';
import type { EditEvent } from '../Operator';

import style from './OperatorEvent.module.scss';

interface OperatorEventProps {
  id: string;
  colour: string;
  cue: string;
  main: string;
  secondary: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  delay?: number;
  isSelected: boolean;
  subscribed?: string;
  subscribeLabel: string;
  isPast: boolean;
  selectedRef?: RefObject<HTMLDivElement>;
  onLongPress: (event: EditEvent) => void;
}

// extract this to contain re-renders
function RollingTime() {
  const { current } = useTimer();
  return <RunningTime value={current} />;
}

function OperatorEvent(props: OperatorEventProps) {
  const {
    id,
    colour,
    cue,
    main,
    secondary,
    timeStart,
    timeEnd,
    duration,
    delay,
    isSelected,
    subscribed,
    subscribeLabel: subscribedAlias,
    isPast,
    selectedRef,
    onLongPress,
  } = props;

  const handleLongPress = (event?: SyntheticEvent) => {
    // we dont have an event out of useLongPress
    event?.preventDefault();
    onLongPress({ id, cue, fieldLabel: subscribedAlias, fieldValue: subscribed ?? '' });
  };

  const mouseHandlers = useLongPress(handleLongPress, { threshold: 800 });
  const cueColours = colour && getAccessibleColour(colour);

  const operatorClasses = cx([
    style.event,
    isSelected ? style.running : null,
    subscribed ? style.subscribed : null,
    isPast ? style.past : null,
  ]);

  return (
    <div className={operatorClasses} ref={selectedRef} onContextMenu={handleLongPress} {...mouseHandlers}>
      <div className={style.binder} style={{ ...cueColours }}>
        <span className={style.cue}>{cue}</span>
      </div>

      <span className={style.mainField}>{main}</span>
      <span className={style.schedule}>
        <ClockTime value={timeStart} preferredFormat12='h:mm' preferredFormat24='HH:mm' />
        -
        <ClockTime value={timeEnd} preferredFormat12='h:mm' preferredFormat24='HH:mm' />
      </span>

      <span className={style.secondaryField}>{secondary}</span>
      <span className={style.runningTime}>
        <DelayIndicator delayValue={delay} />
        {isSelected ? <RollingTime /> : <RunningTime value={duration} hideLeadingZero />}
      </span>

      <div className={style.fields}>
        {subscribed && (
          <>
            <span className={style.field}>{subscribedAlias}</span>
            <span className={style.value}>{subscribed}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(OperatorEvent);
