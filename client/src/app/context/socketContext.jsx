import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { serverURL } from 'app/api/apiConstants';

const SocketContext = createContext([[], () => {}]);

export const useSocket = () => {
  return useContext(SocketContext);
};

function SocketProvider({ children }) {
  const [socket, setSocket] = useState();

  useEffect(() => {
    console.log('starting socket client', serverURL)
    const s = io(serverURL, { transports: ['websocket'] });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export default SocketProvider;
