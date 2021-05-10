import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
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
    <div className={style.messageContainer}>
      <div className={style.inputContainer}>
        <span className={style.label}>Presenter screen message</span>
        <div className={style.inputItems}>
          <Editable
            onChange={(event) => messageControl('pres-text', event)}
            value={pres.text}
            placeholder='only the presenter screens see this'
            className={style.inline}
          >
            <EditablePreview className={style.padleft} />
            <EditableInput className={style.padleft} />
          </Editable>
          <VisibleIconBtn
            active={pres.visible || undefined}
            actionHandler={() => messageControl('toggle-pres-visible')}
            {...inputProps}
          />
        </div>
      </div>

      <div className={style.inputContainerWGap}>
        <span className={style.label}>Public screen message</span>
        <div className={style.inputItems}>
          <Editable
            onChange={(event) => messageControl('publ-text', event)}
            value={publ.text}
            placeholder='public screens will render this'
            className={style.inline}
          >
            <EditablePreview className={style.padleft} />
            <EditableInput className={style.padleft} />
          </Editable>
          <VisibleIconBtn
            active={publ.visible || undefined}
            actionHandler={() => messageControl('toggle-publ-visible')}
            {...inputProps}
          />
        </div>
      </div>

      <div className={style.inputContainerWGap}>
        <span className={style.label}>Lower third message</span>
        <div className={style.inputItems}>
          <Editable
            onChange={(event) => messageControl('lower-text', event)}
            value={lower.text}
            placeholder='visible in lower third screen'
            className={style.inline}
          >
            <EditablePreview className={style.padleft} />
            <EditableInput className={style.padleft} />
          </Editable>

          <VisibleIconBtn
            active={lower.visible || undefined}
            actionHandler={() => messageControl('toggle-lower-visible')}
            {...inputProps}
          />
        </div>
      </div>
    </div>
  );
}
