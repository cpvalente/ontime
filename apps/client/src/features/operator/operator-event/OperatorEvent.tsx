import { memo, RefObject, SyntheticEvent } from 'react';

import DelayIndicator from '../../../common/components/delay-indicator/DelayIndicator';
import useLongPress from '../../../common/hooks/useLongPress';
import { useTimer } from '../../../common/hooks/useSocket';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import ClockTime from '../../viewers/common/clock-time/ClockTime';
import RunningTime from '../../viewers/common/running-time/RunningTime';
import type { EditEvent, Subscribed } from '../Operator';

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
  subscribed: Subscribed | null;
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
    isPast,
    selectedRef,
    onLongPress,
  } = props;

  const handleLongPress = (event?: SyntheticEvent) => {
    // we dont have an event out of useLongPress
    event?.preventDefault();
    if (subscribed) {
      onLongPress({ id, cue, subscriptions: subscribed });
    }
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
        {subscribed &&
          subscribed
            .filter((field) => field.value)
            .map((field) => {
              const fieldClasses = cx([style.field, !field.colour ? style.noColour : null]);
              return (
                <div key={field.id}>
                  <span className={fieldClasses} style={{ backgroundColor: field.colour }}>
                    {field.label}
                  </span>
                  <span className={style.value} style={{ color: field.colour }}>
                    {field.value}
                  </span>
                </div>
              );
            })}
      </div>
    </div>
  );
}

export default memo(OperatorEvent);
