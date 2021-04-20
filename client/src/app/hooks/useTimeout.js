import { useEffect } from 'react';

//
// useTimeout React Hook
//
// React hook for delaying calls with time
export const useTimeout = (
  callback, // function to call. No args passed.
  timeout = 0, // delay, ms (default: immediately put into JS Event Queue)
  {
    // manage re-render behavior.
    // by default, a re-render in your component will re-define the callback,
    //    which will cause this timeout to cancel itself.
    // to avoid cancelling on re-renders (but still cancel on unmounts),
    //    set `persistRenders: true,`.
    persistRenders = false,
  } = {},
  // These dependencies are injected for testing purposes.
  // (pure functions - where all dependencies are arguments - is often easier to test)
  _setTimeout = setTimeout,
  _clearTimeout = clearTimeout,
  _useEffect = useEffect
) => {
  let timeoutId;
  const cancel = () => timeoutId && _clearTimeout(timeoutId);

  _useEffect(
    () => {
      timeoutId = _setTimeout(callback, timeout);
      return cancel;
    },
    persistRenders
      ? [_setTimeout, _clearTimeout]
      : [callback, timeout, _setTimeout, _clearTimeout]
  );

  return cancel;
};
