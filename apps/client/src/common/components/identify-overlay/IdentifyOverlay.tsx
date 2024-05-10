import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@chakra-ui/react';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import { setClientRemote } from '../../hooks/useSocket';
import { useClientStore } from '../../stores/clientStore';

import './Overlay.scss';

export default function IdentifyOverlay() {
  const { clients, id, name, redirect, setRedirect } = useClientStore();
  const { setIdentify } = setClientRemote;
  let identifyTimeout: NodeJS.Timeout | undefined = undefined;
  const navigate = useNavigate();

  useEffect(() => {
    if (redirect !== '') {
      if (redirect !== window.location.pathname) {
        setRedirect('');
        navigate(redirect);
      } else {
        setRedirect('');
      }
    }
  }, [navigate, redirect, setRedirect]);

  const showOverlay = id && clients[id] && clients[id].identify;

  if (!showOverlay) {
    clearTimeout(identifyTimeout);
    return null;
  }

  identifyTimeout = setTimeout(() => setIdentify({ target: id, state: false }), MILLIS_PER_MINUTE);

  return (
    <div className='overlay' data-testid='identify-overlay' onClick={() => setIdentify({ target: id, state: false })}>
      <h1>
        {name}
        <Badge>{id}</Badge>
      </h1>
      <h3>Click to close</h3>
    </div>
  );
}
