import React, { useCallback } from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { IoMicOffOutline } from '@react-icons/all-files/io5/IoMicOffOutline';
import { IoMicSharp } from '@react-icons/all-files/io5/IoMicSharp';
import { useSocket } from 'common/context/socketContext';

import { useMessageControlProvider } from '../../../common/hooks/useSocketProvider';

import InputRow from './InputRow';

import style from './MessageControl.module.scss';

export default function MessageControl() {
  const socket = useSocket();
  const data = useMessageControlProvider();

  const messageControl = useCallback(
    (action, payload) => {
      switch (action) {
        case 'pres-text':
          socket.emit('set-timer-message-text', payload);
          break;
        case 'toggle-pres-visible':
          socket.emit('set-timer-message-visible', payload);
          break;
        case 'publ-text':
          socket.emit('set-public-message-text', payload);
          break;
        case 'toggle-publ-visible':
          socket.emit('set-public-message-visible', payload);
          break;
        case 'lower-text':
          socket.emit('set-lower-message-text', payload);
          break;
        case 'toggle-lower-visible':
          socket.emit('set-lower-message-visible', payload);
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
          text={data.presenter.text}
          visible={data.presenter.visible}
          changeHandler={(event) => messageControl('pres-text', event)}
          actionHandler={() => messageControl('toggle-pres-visible', !data.presenter.visible)}
        />
        <InputRow
          label='Public screen message'
          placeholder='public screens will render this'
          text={data.public.text}
          visible={data.public.visible}
          changeHandler={(event) => messageControl('publ-text', event)}
          actionHandler={() => messageControl('toggle-publ-visible', !data.public.visible)}
        />
        <InputRow
          label='Lower third message'
          placeholder='visible in lower third screen'
          text={data.lower.text}
          visible={data.lower.visible}
          changeHandler={(event) => messageControl('lower-text', event)}
          actionHandler={() => messageControl('toggle-lower-visible', !data.lower.visible)}
        />
      </div>
      <div className={style.onAirToggle}>
        <Tooltip label={data.onAir ? 'Go Off Air' : 'Go On Air'} openDelay={500}>
          <IconButton
            className={style.btn}
            size='md'
            icon={data.onAir ? <IoMicSharp size='24px' /> : <IoMicOffOutline size='24px' />}
            colorScheme='blue'
            variant={data.onAir ? 'solid' : 'outline'}
            onClick={() => messageControl('toggle-onAir', !data.onAir)}
            aria-label='Toggle On Air'
          />
        </Tooltip>
        <span className={style.onAirLabel}>On Air</span>
        <span className={style.oscLabel}>{`/ontime/offAir << OSC >> /ontime/onAir`}</span>
      </div>
    </>
  );
}
