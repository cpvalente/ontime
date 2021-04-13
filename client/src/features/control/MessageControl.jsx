import { FormControl } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { useEffect, useState } from 'react';
import { useSocket } from '../../app/context/socketContext';
import VisibleIconBtn from '../../common/components/buttons/VisibleIconBtn';
import style from './MessageControl.module.css';

const inputProps = {
  size: 'sm',
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
  const [lower, setLower] = useState({
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

    // Handle lower third messages
    socket.on('messages-lower', (data) => {
      setLower({ ...data });
    });

    // Ask for up to date data
    socket.emit('get-messages');

    // Clear listeners
    return () => {
      socket.off('messages-public');
      socket.off('messages-presenter');
      socket.off('messages-lower');
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
      case 'lower-text':
        socket.emit('set-lower-text', payload);
        break;
      case 'toggle-lower-visible':
        socket.emit('set-lower-visible', !lower.visible);
        break;

      default:
        break;
    }
  };

  return (
    <>
      <div className={style.inputContainer}>
        <FormControl id='presenterMessage'>
          <span className={style.label}>Presenter screen message</span>
          <Input
            placeholder='only the presenter screens see this'
            onChange={(event) =>
              messageControl('pres-text', event.target.value)
            }
            {...inputProps}
          />
        </FormControl>
        <VisibleIconBtn
          active={pres.visible}
          clickHandler={() => messageControl('toggle-pres-visible')}
          {...inputProps}
        />
      </div>

      <div className={style.inputContainerWGap}>
        <FormControl id='generalMessage'>
          <span className={style.label}>Public screen message</span>
          <Input
            placeholder='all screens will render this'
            onChange={(event) =>
              messageControl('publ-text', event.target.value)
            }
            {...inputProps}
          />
        </FormControl>
        <VisibleIconBtn
          active={publ.visible}
          clickHandler={() => messageControl('toggle-publ-visible')}
          {...inputProps}
        />
      </div>

      <div className={style.inputContainerWGap}>
        <FormControl id='lowerMessage'>
          <span className={style.label}>Lower third message</span>
          <Input
            placeholder='visible in lower third screen'
            onChange={(event) =>
              messageControl('lower-text', event.target.value)
            }
            {...inputProps}
          />
        </FormControl>
        <VisibleIconBtn
          active={lower.visible}
          clickHandler={() => messageControl('toggle-lower-visible')}
          {...inputProps}
        />
      </div>
    </>
  );
}
