import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    console.log('clear');

    clearTimeout(identifyTimeout);
    return null;
  }

  identifyTimeout = setTimeout(() => {
    console.log('timeout');
    setIdentify({ target: id, state: false });
  }, MILLIS_PER_MINUTE);

  return (
    <div className='overlay' data-testid='identify-overlay' onClick={() => setIdentify({ target: id, state: false })}>
      <div className='name'>{name}</div>
      <div className='message'>Click to close</div>
    </div>
  );
}
