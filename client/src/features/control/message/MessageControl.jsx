import React, { useCallback, useEffect, useState } from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { IoMicOffOutline } from '@react-icons/all-files/io5/IoMicOffOutline';
import { IoMicSharp } from '@react-icons/all-files/io5/IoMicSharp';
import { useSocket } from 'app/context/socketContext';

import InputRow from './InputRow';

import style from './MessageControl.module.scss';

export default function MessageControl() {
  const socket = useSocket();
  const [pres, setPres] = useState({
    text: '',
    visible: false,
  });
  const [publ, setPubl] = useState({
    text: '',
    visible: false,
  });
  const [lower, setLower] = useState({
    text: '',
    visible: false,
  });
  const [onAir, setonAir] = useState(false);

  useEffect(() => {
    if (socket == null) return;

    // Handle timer messages
    socket.on('messages-timer', (data) => {
      setPres({ ...data });
    });

    // Handle public messages
    socket.on('messages-public', (data) => {
      setPubl({ ...data });
    });

    // Handle lower third messages
    socket.on('messages-lower', (data) => {
      setLower({ ...data });
    });

    // Handle lower third messages
    socket.on('onAir', (data) => {
      setonAir(data);
    });

    // Ask for up to date data
    socket.emit('get-messages');
    // Ask for onAir state
    socket.emit('get-onAir');

    // Clear listeners
    return () => {
      socket.off('messages-public');
      socket.off('messages-timer');
      socket.off('messages-lower');
      socket.off('onAir');
    };
  }, [socket]);

  const messageControl = useCallback(
    (action, payload) => {
      switch (action) {
        case 'pres-text':
          socket.emit('set-timer-text', payload);
          break;
        case 'toggle-pres-visible':
          socket.emit('set-timer-visible', payload);
          break;
        case 'publ-text':
          socket.emit('set-public-text', payload);
          break;
        case 'toggle-publ-visible':
          socket.emit('set-public-visible', payload);
          break;
        case 'lower-text':
          socket.emit('set-lower-text', payload);
          break;
        case 'toggle-lower-visible':
          socket.emit('set-lower-visible', payload);
          break;
        case 'toggle-onAir':
          socket.emit('set-onAir', payload);
          break;
        default:
          break;
      }
    },
    [socket]
  );

  return (
    <>
      <div className={style.messageContainer}>
        <InputRow
          label='Timer screen message'
          placeholder='only the presenter screens see this'
          text={pres.text}
          visible={pres.visible}
          changeHandler={(event) => messageControl('pres-text', event)}
          actionHandler={() => messageControl('toggle-pres-visible', !pres.visible)}
        />
        <InputRow
          label='Public screen message'
          placeholder='public screens will render this'
          text={publ.text}
          visible={publ.visible}
          changeHandler={(event) => messageControl('publ-text', event)}
          actionHandler={() => messageControl('toggle-publ-visible', !publ.visible)}
        />
        <InputRow
          label='Lower third message'
          placeholder='visible in lower third screen'
          text={lower.text}
          visible={lower.visible}
          changeHandler={(event) => messageControl('lower-text', event)}
          actionHandler={() => messageControl('toggle-lower-visible', !lower.visible)}
        />
      </div>
      <div className={style.onAirToggle}>
        <Tooltip label={onAir ? 'Go Off Air' : 'Go On Air'} openDelay={500}>
          <IconButton
            className={style.btn}
            size='md'
            icon={onAir ? <IoMicSharp size='24px' /> : <IoMicOffOutline size='24px' />}
            colorScheme='blue'
            variant={onAir ? 'solid' : 'outline'}
            onClick={() => messageControl('toggle-onAir', !onAir)}
            aria-label='Toggle On Air'
          />
        </Tooltip>
        <span className={style.onAirLabel}>On Air</span>
        <span className={style.oscLabel}>{`/ontime/offAir << OSC >> /ontime/onAir`}</span>
      </div>
    </>
  );
}
