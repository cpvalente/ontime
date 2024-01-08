import { memo, RefObject, SyntheticEvent } from 'react';

import DelayIndicator from '../../../common/components/delay-indicator/DelayIndicator';
import useLongPress from '../../../common/hooks/useLongPress';
import { useTimer } from '../../../common/hooks/useSocket';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';
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
  subscribedAlias: string;
  showSeconds: boolean;
  isPast: boolean;
  selectedRef?: RefObject<HTMLDivElement>;
  onLongPress: (event: EditEvent) => void;
}

// extract this to contain re-renders
function RollingTime() {
  const timer = useTimer();
  return <>{formatTime(timer.current, { showSeconds: true, format: 'hh:mm:ss' })}</>;
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
    subscribedAlias,
    showSeconds,
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

  const start = formatTime(timeStart, { showSeconds });
  const end = formatTime(timeEnd, { showSeconds });

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
        {start} - {end}
      </span>

      <span className={style.secondaryField}>{secondary}</span>
      <span className={style.running}>
        <DelayIndicator delayValue={delay} />
        {isSelected ? <RollingTime /> : formatTime(duration, { showSeconds: true, format: 'hh:mm:ss' })}
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
