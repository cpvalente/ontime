import { useCallback, useEffect } from 'react';
import { MILLIS_PER_MINUTE } from 'ontime-utils';

import { setClientRemote } from '../../hooks/useSocket';
import { useClientStore } from '../../stores/clientStore';

import style from './Overlay.module.scss';

export default function IdentifyOverlay() {
  const clients = useClientStore((store) => store.clients);
  const id = useClientStore((store) => store.id);
  const name = useClientStore((store) => store.name);
  const { setIdentify } = setClientRemote;
  const showOverlay = clients[id]?.identify;

  const handleClose = useCallback(() => {
    setIdentify({ target: id, identify: false });
  }, [id, setIdentify]);

  // start a timer that will close the overlay after some time
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOverlay) {
      timer = setTimeout(handleClose, MILLIS_PER_MINUTE);
    }
    return () => clearTimeout(timer);
  }, [showOverlay, id, setIdentify, handleClose]);

  if (!showOverlay) {
    return null;
  }

  return (
    <div className={style.overlay} data-testid='identify-overlay' onClick={handleClose}>
      <div className={style.name}>{name}</div>
      <div className={style.message}>Click to close</div>
    </div>
  );
}
