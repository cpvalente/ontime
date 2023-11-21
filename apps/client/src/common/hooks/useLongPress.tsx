import { useMemo, useRef } from 'react';

type LongPressOptions = {
  threshold?: number;
  onStart?: (e: Event) => void;
  onFinish?: (e: Event) => void;
  onCancel?: (e: Event) => void;
};

type LongPressFns = {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
};

export default function useLongPress(callback: () => void, options: LongPressOptions = {}): LongPressFns {
  const { threshold = 400, onStart, onFinish, onCancel } = options;
  const isLongPressActive = useRef(false);
  const isPressed = useRef(false);
  const timerId = useRef<NodeJS.Timer>();

  return useMemo(() => {
    if (typeof callback !== 'function') {
      return {};
    }

    const start = (event: MouseEvent) => {
      if (onStart) {
        onStart(event);
      }

      isPressed.current = true;
      timerId.current = setTimeout(() => {
        callback();
        isLongPressActive.current = true;
      }, threshold);
    };

    const cancel = (event: MouseEvent) => {
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

    const mouseHandlers = {
      onMouseDown: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
    };

    const touchHandlers = {
      onTouchStart: start,
      onTouchEnd: cancel,
    };

    return {
      ...mouseHandlers,
      ...touchHandlers,
    };
  }, [callback, threshold, onCancel, onFinish, onStart]);
}
