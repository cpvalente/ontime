import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Progress } from '@chakra-ui/react';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import { setClientRemote } from '../../hooks/useSocket';
import { useClientStore } from '../../stores/clientStore';
import { socketSendJson } from '../../utils/socket';

import style from './Overlay.module.scss';
const tickRate = 30;

export default function IdentifyOverlay() {
  const { clients, id, name, redirect, setRedirect } = useClientStore();
  const { setIdentify } = setClientRemote;
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const showOverlay = clients[id]?.identify;
  const [identifyTimeout, setIdentifyTimeout] = useState(0);

  // notify server of users new path if it changes
  useEffect(() => {
    socketSendJson('set-client-path', pathname + search);
  }, [pathname, search]);

  // navigate to new path when received from server
  useEffect(() => {
    if (redirect !== '') {
      if (redirect !== pathname + search) {
        setRedirect('');
        navigate(redirect);
      } else {
        setRedirect('');
      }
    }
  }, [pathname, navigate, redirect, setRedirect, search]);

  // start timeout for indetify overlay
  useEffect(() => {
    if (showOverlay) {
      setIdentifyTimeout(MILLIS_PER_MINUTE);
    } else {
      setIdentifyTimeout(0);
    }
  }, [showOverlay]);

  // handle progressbar animation
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
    return null;
  }

  return (
    <div
      className='overlay'
      data-testid='identify-overlay'
      onClick={() => setIdentify({ target: id, identify: false })}
    >
      <div className={style.name}>{name}</div>
      <div className={style.message}>Click to close</div>
      <Progress className={style.progress} value={(identifyTimeout / MILLIS_PER_MINUTE) * 100} size='lg' />
    </div>
  );
}
