import { useMemo } from 'react';

import { setClientRemote } from '../../hooks/useSocket';
import { useClientStore } from '../../stores/clientStore';

import './Overlay.scss';

export default function IdentifyOverlay() {
  const { clients, myName } = useClientStore();
  const { setIdentify } = setClientRemote;

  const showOverlay = useMemo(() => {
    return myName && clients[myName] && clients[myName].identify;
  }, [clients, myName]);

  if (showOverlay) {
    return (
      <div className='overlay' onClick={() => setIdentify({ target: myName!, state: false })}>
        <h1>{myName}</h1>
        <h3>Click to close</h3>
      </div>
    );
  }

  return null;
}
