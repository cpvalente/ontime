import { MouseEvent, SyntheticEvent, TouchEvent, useMemo, useRef } from 'react';

type LongPressOptions = {
  threshold?: number;
  onStart?: (e: SyntheticEvent) => void;
  onFinish?: (e: SyntheticEvent) => void;
  onCancel?: (e: SyntheticEvent) => void;
};

type LongPressFns = {
  onMouseDown: (e: MouseEvent) => void;
  onMouseUp: (e: MouseEvent) => void;
  onMouseLeave: (e: MouseEvent) => void;
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
};

export default function useLongPress(callback: () => void, options: LongPressOptions = {}): LongPressFns {
  const { threshold = 400, onStart, onFinish, onCancel } = options;
  const isLongPressActive = useRef(false);
  const isPressed = useRef(false);
  const timerId = useRef<NodeJS.Timeout>();

  return useMemo(() => {
    const start = (event: SyntheticEvent) => {
      if (onStart) {
        onStart(event);
      }

      isPressed.current = true;
      timerId.current = setTimeout(() => {
        callback();
        isLongPressActive.current = true;
      }, threshold);
    };

    const cancel = (event: SyntheticEvent) => {
      if (isLongPressActive.current) {
        if (onFinish) {
          onFinish(event);
        }
      } else if (isPressed.current) {
        if (onCancel) {
          onCancel(event);
        }
      }

      isLongPressActive.current = false;
      isPressed.current = false;

      if (timerId.current) {
        clearTimeout(timerId.current);
      }
    };

    return {
      onMouseDown: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: cancel,
    };
  }, [callback, threshold, onCancel, onFinish, onStart]);
}
