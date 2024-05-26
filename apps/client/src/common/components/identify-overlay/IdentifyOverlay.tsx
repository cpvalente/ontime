import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@chakra-ui/react';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import { setClientRemote } from '../../hooks/useSocket';
import { useClientStore } from '../../stores/clientStore';

import './Overlay.scss';

export default function IdentifyOverlay() {
  const { clients, id, name, redirect, setRedirect } = useClientStore();
  const { setIdentify } = setClientRemote;
  const navigate = useNavigate();
  const showOverlay = clients[id]?.identify;
  const [identifyTimeout, setIdentifyTimeout] = useState(0);

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
      setIdentifyTimeout(MILLIS_PER_MINUTE);
    } else {
      setIdentifyTimeout(0);
    }
  }, [showOverlay]);

  useEffect(() => {
    const progressInterval = setTimeout(() => {
      if (identifyTimeout < tickRate) {
        clearTimeout(progressInterval);
        setIdentify({ target: id, identify: false });
        setIdentifyTimeout(0);
      } else {
        setIdentifyTimeout((value) => value - tickRate);
      }
    }, tickRate);

    return () => {
      clearTimeout(progressInterval);
    };
  }, [id, identifyTimeout, setIdentify]);

  if (!showOverlay) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <></>;
  }

  return (
    <div
      className='overlay'
      data-testid='identify-overlay'
      onClick={() => setIdentify({ target: id, identify: false })}
    >
      <div className='name'>{name}</div>
      <div className='message'>Click to close</div>
      <Progress className='progress' value={(identifyTimeout / MILLIS_PER_MINUTE) * 100} size='lg' />
    </div>
  );
}

const tickRate = 30;
