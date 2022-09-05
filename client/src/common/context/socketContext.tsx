// @ts-nocheck
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { serverURL } from 'common/api/apiConstants';
import io, { Socket } from 'socket.io-client';

interface SocketProviderState {
  socket: Socket;
}

type SocketProviderProps = {
  children: ReactNode;
};

const SocketContext = createContext<SocketProviderState | undefined>(undefined);

export const useSocket = () => {
  return useContext(SocketContext);
};

function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState({} as Socket);

  useEffect(() => {
    const s = io(serverURL, { transports: ['websocket'] });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export default SocketProvider;
