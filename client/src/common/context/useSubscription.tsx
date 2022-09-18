import { useEffect, useState } from 'react';

import { useSocket } from './socketContext';

export default function useSubscription<T>(topic: string, initialState: T) {
  const socket = useSocket();
  const [state, setState] = useState<T>(initialState);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.emit(`get-${topic}`);
    socket.on(topic, setState);

    return () => {
      socket.off(topic);
    };
  }, [socket, topic]);

  return [state, setState];
};
