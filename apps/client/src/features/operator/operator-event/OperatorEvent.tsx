import { memo, RefObject, SyntheticEvent } from 'react';
import { millisToString, removePrependedZero } from 'ontime-utils';

import DelayIndicator from '../../../common/components/delay-indicator/DelayIndicator';
import useLongPress from '../../../common/hooks/useLongPress';
import { useTimer } from '../../../common/hooks/useSocket';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';
import SuperscriptTime from '../../viewers/common/superscript-time/SuperscriptTime';
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
  isPast: boolean;
  selectedRef?: RefObject<HTMLDivElement>;
  onLongPress: (event: EditEvent) => void;
}

// extract this to contain re-renders
function RollingTime() {
  const timer = useTimer();
  return <>{millisToString(timer.current)}</>;
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

  const start = formatTime(timeStart);
  const end = formatTime(timeEnd);

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
        <SuperscriptTime time={start} />
        -
        <SuperscriptTime time={end} />
      </span>

      <span className={style.secondaryField}>{secondary}</span>
      <span className={style.running}>
        <DelayIndicator delayValue={delay} />
        {isSelected ? <RollingTime /> : <SuperscriptTime time={removePrependedZero(millisToString(duration))} />}
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
