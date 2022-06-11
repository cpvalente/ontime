import React, { createContext, useContext, useEffect, useState } from 'react';
import { serverURL } from 'app/api/apiConstants';
import io from 'socket.io-client';

const SocketContext = createContext([[], () => {}]);

export const useSocket = () => {
  return useContext(SocketContext);
};

function SocketProvider({ children }) {
  const [socket, setSocket] = useState();

  useEffect(() => {
    const s = io(serverURL, { transports: ['websocket'] });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export default SocketProvider;
