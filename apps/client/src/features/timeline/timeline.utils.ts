type TimelineState = {
  scheduleStart: number;
  scheduleEnd: number;
  eventStart: number;
  eventDuration: number;
};

type CSSPosition = {
  left: number;
  width: number;
};

// TODO: reuse for cursors, with a minimum width of 1
export function getCSSPosition(state: TimelineState): CSSPosition {
  const { scheduleStart, scheduleEnd, eventStart, eventDuration } = state;

  let left = 0;
  let right = 100;

  if (scheduleStart !== eventStart) {
    const absLeft = eventStart - scheduleStart;
    const totalDuration = scheduleEnd - scheduleStart;
    left = (absLeft * 100) / totalDuration;
  }

  const eventEnd = eventStart + eventDuration;
  if (scheduleEnd !== eventEnd) {
    const absRight = eventEnd - scheduleStart;
    const totalDuration = scheduleEnd - scheduleStart;
    right = (absRight * 100) / totalDuration;
  }

  return { left, width: right - left };
}
