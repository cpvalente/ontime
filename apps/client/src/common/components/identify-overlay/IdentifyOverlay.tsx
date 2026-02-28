import { MILLIS_PER_MINUTE } from 'ontime-utils';
import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { setClientRemote } from '../../hooks/useSocket';
import { useClientStore } from '../../stores/clientStore';

import style from './IdentifyOverlay.module.scss';

export default function IdentifyOverlay() {
  const clients = useClientStore((store) => store.clients);
  const id = useClientStore((store) => store.id);
  const showOverlay = clients[id]?.identify;

  if (!showOverlay) {
    return null;
  }

  const portalRoot = document.getElementById('identify-portal');

  if (!portalRoot) {
    return null;
  }
  return createPortal(<Overlay />, portalRoot);
}

function Overlay() {
  const clients = useClientStore((store) => store.clients);
  const id = useClientStore((store) => store.id);
  const name = useClientStore((store) => store.name);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { setIdentify } = setClientRemote;
  const showOverlay = clients[id]?.identify;

  const handleClose = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIdentify({ target: id, identify: false });
  }, [id, setIdentify]);

  // start a timer that will close the overlay after some time
  useEffect(() => {
    if (showOverlay) {
      timerRef.current = setTimeout(handleClose, MILLIS_PER_MINUTE);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [showOverlay, id, setIdentify, handleClose]);

  return (
    <div className={style.overlay} data-testid='identify-overlay' onClick={handleClose}>
      <div className={style.name}>{name}</div>
      <div className={style.message}>Click to close</div>
    </div>
  );
}
