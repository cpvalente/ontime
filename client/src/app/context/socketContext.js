import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { serverURL } from 'app/api/apiConstants';

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
