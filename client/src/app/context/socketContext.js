import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { serverURL } from '../api/apiConstants';

export const SocketContext = createContext([[], () => {}]);

export const useSocket = () => {
  return useContext(SocketContext);
};

function SocketProvider(props) {
  const [socket, setSocket] = useState();

  useEffect(() => {
    const socket = io(serverURL);
    setSocket(socket);
    return () => socket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
}
export default SocketProvider;
