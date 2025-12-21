import { CSSProperties, memo, RefObject, SyntheticEvent } from 'react';
import { MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import DelayIndicator from '../../../common/components/delay-indicator/DelayIndicator';
import { useLongPress } from '../../../common/hooks/useLongPress';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatDuration, formatTime, useTimeUntilExpectedStart } from '../../../common/utils/time';
import RunningTime from '../../../views/common/running-time/RunningTime';
import SuperscriptPeriod from '../../../views/common/superscript-time/SuperscriptPeriod';
import type { EditEvent, Subscribed } from '../operator.types';

import style from './OperatorEvent.module.scss';

interface OperatorEventProps {
  id: string;
  colour: string;
  cue: string;
  main: string;
  secondary: string;
  timeStart: number;
  duration: number;
  delay: number;
  dayOffset: number;
  isLinkedToLoaded: boolean;
  isSelected: boolean;
  isPast: boolean;
  selectedRef?: RefObject<HTMLDivElement | null>;
  showStart: boolean;
  subscribed: Subscribed;
  totalGap: number;
  onLongPress: (event: EditEvent) => void;
}

export default memo(OperatorEvent);
function OperatorEvent({
  id,
  colour,
  cue,
  main,
  secondary,
  timeStart,
  duration,
  delay,
  dayOffset,
  isLinkedToLoaded,
  isSelected,
  isPast,
  selectedRef,
  showStart,
  subscribed,
  totalGap,
  onLongPress,
}: OperatorEventProps) {
  /**
   * gather behaviour for long press and context menu
   */
  const handleLongPress = (event?: SyntheticEvent) => {
    // prevent default if the event is cancelable to avoid browser intervention warnings
    if (event && event.cancelable) {
      event.preventDefault();
    }
    if (subscribed) {
      onLongPress({ id, cue, subscriptions: subscribed });
    }
  };

  const mouseHandlers = useLongPress(handleLongPress);
  const cueColours = colour && getAccessibleColour(colour);

  const operatorClasses = cx([style.event, isSelected && style.running, isPast && style.past]);

  const hasFields = subscribed.some((field) => field.value);
  const columnCount = subscribed.length ? Math.min(subscribed.length, 4) : 0;
  const fieldGridStyle =
    columnCount > 0
      ? ({
          gridTemplateColumns: `repeat(${columnCount}, minmax(12rem, 1fr))`,
        } satisfies CSSProperties)
      : undefined;

  return (
    <div
      className={operatorClasses}
      data-testid={cue}
      ref={selectedRef}
      onContextMenu={handleLongPress}
      {...mouseHandlers}
    >
      <div className={style.binder} style={{ ...cueColours }}>
        <span className={style.cue}>{cue}</span>
      </div>

      <span className={style.mainField}>
        {showStart && <SuperscriptPeriod className={style.plannedStart} time={formatTime(timeStart)} />}
        {main}
      </span>
      <span className={style.secondaryField}>{secondary}</span>
      <OperatorEventSchedule
        timeStart={timeStart}
        isPast={isPast}
        isSelected={isSelected}
        delay={delay}
        dayOffset={dayOffset}
        totalGap={totalGap}
        isLinkedToLoaded={isLinkedToLoaded}
      />
      <span className={style.runningTime}>
        <DelayIndicator delayValue={delay} />
        <RunningTime className={cx([isSelected && style.muted])} value={duration} hideLeadingZero />
      </span>

      <div className={cx([style.fields, hasFields && style.fieldsWithContent])} style={fieldGridStyle}>
        {subscribed.map((field) => {
          if (!field.value) {
            return <div key={field.id} />;
          }
          return (
            <div key={field.id}>
              <span
                className={cx([style.field, !field.colour && style.noColour])}
                style={{ backgroundColor: field.colour }}
              >
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

interface OperatorEventScheduleProps {
  timeStart: number;
  isPast: boolean;
  isSelected: boolean;
  delay: number;
  dayOffset: number;
  totalGap: number;
  isLinkedToLoaded: boolean;
}
function OperatorEventSchedule({
  timeStart,
  isPast,
  isSelected,
  delay,
  dayOffset,
  totalGap,
  isLinkedToLoaded,
}: OperatorEventScheduleProps) {
  if (isPast) {
    return <span className={style.timeUntil}>DONE</span>;
  }

  if (isSelected) {
    return <span className={style.timeUntil}>LIVE</span>;
  }

  return (
    <TimeUntil
      timeStart={timeStart}
      delay={delay}
      dayOffset={dayOffset}
      totalGap={totalGap}
      isLinkedToLoaded={isLinkedToLoaded}
    />
  );
}

interface TimeUntilProps {
  timeStart: number;
  delay: number;
  dayOffset: number;
  totalGap: number;
  isLinkedToLoaded: boolean;
}
function TimeUntil({ timeStart, delay, dayOffset, totalGap, isLinkedToLoaded }: TimeUntilProps) {
  // we isolate this to avoid unnecessary re-renders
  const timeUntil = useTimeUntilExpectedStart({ timeStart, delay, dayOffset }, { totalGap, isLinkedToLoaded });

  const isDue = timeUntil < MILLIS_PER_SECOND;
  const timeUntilString = isDue ? 'DUE' : `${formatDuration(Math.abs(timeUntil), timeUntil > 2 * MILLIS_PER_MINUTE)}`;

  return (
    <span className={style.timeUntil} data-testid='time-until'>
      {timeUntilString}
    </span>
  );
}
