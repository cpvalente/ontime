import { useEffect, useState } from 'react';

import { useSocket } from './socketContext';

export default function useSubscription<T>(topic: string, initialState: T, requestString?: string) {
  const socket = useSocket();
  const [state, setState] = useState<T>(initialState);

  useEffect(() => {
    if (!socket) {
      return;
    }

    if (requestString) {
      socket.emit(requestString);
    } else {
      socket.emit(`get-${topic}`);
    }
    socket.on(topic, setState);

    return () => {
      socket.off(topic);
    };
  }, [requestString, socket, topic]);

  return [state, setState] as const;
};
