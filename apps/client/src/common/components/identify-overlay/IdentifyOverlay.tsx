import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { setClientRemote } from '../../hooks/useSocket';
import { useClientStore } from '../../stores/clientStore';

import './Overlay.scss';

export default function IdentifyOverlay() {
  const { clients, myName } = useClientStore();
  const { setIdentify, setRedirect } = setClientRemote;

  //TODO: is this the right place for it
  const navigate = useNavigate();

  useMemo(() => {
    if (myName && clients[myName] && clients[myName].redirect != '') {
      const { redirect } = clients[myName];
      if (redirect != window.location.pathname) {
        navigate(redirect);
      } else {
        setRedirect({ target: myName, path: '' });
      }
    }
  }, [clients, myName, navigate, setRedirect]);

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
