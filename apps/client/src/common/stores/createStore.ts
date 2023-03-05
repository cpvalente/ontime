export default function createStore<T>(initialState: T) {
  let currentState = initialState;
  const listeners = new Set<(state: T) => void>();

  return {
    get: () => currentState,
    set: (newState: T) => {
      currentState = newState;
    },
    subscribe: (listener: (state: T) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
