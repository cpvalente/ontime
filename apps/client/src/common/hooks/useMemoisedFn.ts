/**
 * Shamelessly from https://ahooks.js.org/hooks/use-memoized-fn/
 * Interesting technique discussed by Dan Abramov
 * https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 */

import { useMemo, useRef } from 'react';

import { isDev } from '../../externals';

type noop = (this: any, ...args: any[]) => any;

type PickFunction<T extends noop> = (this: ThisParameterType<T>, ...args: Parameters<T>) => ReturnType<T>;

const isFunction = (value: unknown): value is (...args: any) => any => typeof value === 'function';

export default function useMemoisedFn<T extends noop>(fn: T) {
  if (isDev) {
    if (!isFunction(fn)) {
      console.error(`useMemoisedFn expected function as parameter, got ${typeof fn}`);
    }
  }

  const fnRef = useRef<T>(fn);

  // why not write `fnRef.current = fn`?
  // https://github.com/alibaba/hooks/issues/728
  fnRef.current = useMemo(() => fn, [fn]);

  const memoizedFn = useRef<PickFunction<T>>(undefined);
  if (!memoizedFn.current) {
    memoizedFn.current = function (this, ...args) {
      return fnRef.current.apply(this, args);
    };
  }

  return memoizedFn.current as T;
}
