import { IconButton } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { FiSun } from 'react-icons/fi';
import { Input } from '@chakra-ui/input';
import { useEffect, useState } from 'react';
import { useSocket } from '../../app/context/socketContext';
import style from './MessageControl.module.css';

// Button definition
const btnDef = {
  colorScheme: 'blue',
  icon: <FiSun />,
};

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

  // Torbjorn: why is this not updating?
  useEffect(() => {
    if (socket == null) return;

    // Handle presenter messages
    socket.on('messages-presenter', (data) => {
      console.log('websocket: got data', data);
      setPres({ ...data });
    });

    // Handle public messages
    socket.on('messages-public', (data) => {
      console.log('websocket: got data', data);
      setPubl({ ...data });
    });

    // Ask for up to date data
    socket.emit('get-presenter');
    socket.emit('get-public');

    // Clear listener
    return () => socket.off('messages-presenter', 'messages-public');
  }, [socket]);

  const messageControl = async (action, payload) => {
    switch (action) {
      case 'pres-text':
        socket.emit('set-presenter-text', payload);
        break;
      case 'toggle-pres-visible':
        socket.emit('set-presenter-visible', !pres.visible);
        break;
      case 'publ-text':
        socket.emit('set-public-text', payload);
        break;
      case 'toggle-publ-visible':
        socket.emit('set-public-visible', !publ.visible);
        break;

      default:
        break;
    }
  };

  return (
    <>
      <div className={style.inputContainer}>
        <FormControl id='presenterMessage'>
          <FormLabel>Presenter screen message</FormLabel>
          <Input
            placeholder='only the presenter screens see this'
            onChange={(event) =>
              messageControl('pres-text', event.target.value)
            }
          />
        </FormControl>
        <IconButton
          className={style.btn}
          {...btnDef}
          variant={pres.visible ? 'solid' : 'outline'}
          onClick={() => messageControl('toggle-pres-visible')}
        />
      </div>

      <div className={style.inputContainerWGap}>
        <FormControl id='generalMessage'>
          <FormLabel>Public screen message</FormLabel>
          <Input
            placeholder='all screens will render this'
            onChange={(event) =>
              messageControl('publ-text', event.target.value)
            }
          />
        </FormControl>
        <IconButton
          className={style.btn}
          {...btnDef}
          variant={publ.visible ? 'solid' : 'outline'}
          onClick={() => messageControl('toggle-publ-visible')}
        />
      </div>
    </>
  );
}
