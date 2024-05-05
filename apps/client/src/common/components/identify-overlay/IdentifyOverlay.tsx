import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@chakra-ui/react';

import { setClientRemote } from '../../hooks/useSocket';
import { useClientStore } from '../../stores/clientStore';

import './Overlay.scss';

export default function IdentifyOverlay() {
  const { clients, id, name } = useClientStore();
  const { setIdentify, setRedirect } = setClientRemote;

  //TODO: is this the right place for it
  const navigate = useNavigate();

  useEffect(() => {
    if (id && clients[id] && clients[id].redirect !== '') {
      const { redirect } = clients[id];
      if (redirect !== window.location.pathname) {
        navigate(redirect);
      } else {
        setRedirect({ target: id, path: '' });
      }
    }
  }, [clients, id, navigate, setRedirect]);

  const showOverlay = useMemo(() => {
    return id && clients[id] && clients[id].identify;
  }, [clients, id]);

  if (showOverlay) {
    return (
      <div className='overlay' onClick={() => setIdentify({ target: id!, state: false })}>
        <h1>
          {name}
          <Badge>{id}</Badge>
        </h1>
        <h3>Click to close</h3>
      </div>
    );
  }

  return null;
}
