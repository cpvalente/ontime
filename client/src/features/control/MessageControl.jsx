import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { useEffect, useState } from 'react';
import { useSocket } from '../../app/context/socketContext';
import VisibleIconBtn from '../../common/components/buttons/VisibleIconBtn';
import style from './MessageControl.module.css';

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

  useEffect(() => {
    if (socket == null) return;

    // Handle presenter messages
    socket.on('messages-presenter', (data) => {
      setPres({ ...data });
    });

    // Handle public messages
    socket.on('messages-public', (data) => {
      setPubl({ ...data });
    });

    // Ask for up to date data
    socket.emit('get-presenter');
    socket.emit('get-public');

    // Clear listeners
    return () => {
      socket.off('messages-public');
      socket.off('messages-presenter');
    };
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
        <VisibleIconBtn
          size='md'
          active={pres.visible}
          clickHandler={() => messageControl('toggle-pres-visible')}
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
        <VisibleIconBtn
          size='md'
          active={publ.visible}
          clickHandler={() => messageControl('toggle-publ-visible')}
        />
      </div>
    </>
  );
}
