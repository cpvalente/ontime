import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import { setClientRemote } from '../../hooks/useSocket';
import { useClientStore } from '../../stores/clientStore';

import './Overlay.scss';

export default function IdentifyOverlay() {
  const { clients, id, name, redirect, setRedirect } = useClientStore();
  const { setIdentify } = setClientRemote;
  const identifyTimeout = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();
  const showOverlay = clients[id]?.identify;

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

  useEffect(() => {
    if (showOverlay) {
      identifyTimeout.current = setTimeout(() => {
        setIdentify({ target: id, state: false });
      }, MILLIS_PER_MINUTE);
    } else {
      if (identifyTimeout.current) {
        clearTimeout(identifyTimeout.current);
      }
    }

    return () => {
      if (identifyTimeout.current) {
        clearTimeout(identifyTimeout.current);
      }
    };
  }, [clients, id, setIdentify, showOverlay]);

  if (!showOverlay) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <></>;
  }

  return (
    <div className='overlay' data-testid='identify-overlay' onClick={() => setIdentify({ target: id, state: false })}>
      <div className='name'>{name}</div>
      <div className='message'>Click to close</div>
    </div>
  );
}
