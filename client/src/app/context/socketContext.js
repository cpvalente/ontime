import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { NODE_PORT } from '../api/apiConstants';

// get origin from URL
const serverURL = window.location.origin.replace(
  window.location.port,
  `${NODE_PORT}/`
);

const SocketContext = createContext([[], () => {}]);

export const useSocket = () => {
  return useContext(SocketContext);
};

function SocketProvider(props) {
  const [socket, setSocket] = useState();

  useEffect(() => {
    const s = io(serverURL, { transports: ['websocket'] });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
}
export default SocketProvider;
