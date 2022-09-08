// @ts-nocheck
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { serverURL } from 'common/api/apiConstants';
import io, { Socket } from 'socket.io-client';

interface SocketProviderState {
  socket: Socket | null;
  emit: <T>(topic: string, payload?: T) => void;
  on: <T>(topic: string, callback: (data: T) => void) => void;
  off: (topic: string) => void;
}

type SocketProviderProps = {
  children: ReactNode;
};

const SocketContext = createContext<SocketProviderState>({
  socket: null,
  emit: () => {},
  on: () => {},
  off: () => {}
});

export const useSocket = () => {
  return useContext(SocketContext);
};

function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState({} as Socket);

  useEffect(() => {
    const socketInstance = io(serverURL, { transports: ["websocket"] });
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export default SocketProvider;
