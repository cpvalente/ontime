import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { Switch } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useSocket } from 'app/context/socketContext';
import VisibleIconBtn from 'common/components/buttons/VisibleIconBtn';
import style from './MessageControl.module.scss';
import { Tooltip } from '@chakra-ui/tooltip';

const inputProps = {
  size: 'sm',
};

const InputRow = (props) => {
  const { label, placeholder, text, visible } = props;

  return (
    <>
      <span className={style.label}>{label}</span>
      <div className={style.inputItems}>
        <Editable
          onChange={(event) => props.changeHandler(event)}
          value={text}
          placeholder={placeholder}
          className={style.inline}
          color={text === '' ? '#666' : 'inherit'}
        >
          <EditablePreview className={style.padleft} />
          <EditableInput className={style.padleft} />
        </Editable>
        <VisibleIconBtn
          active={visible || undefined}
          actionHandler={props.actionHandler}
          {...inputProps}
        />
      </div>
    </>
  );
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
  const [onAir, setonAir] = useState(false);

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
      socket.off('messages-presenter');
      socket.off('messages-lower');
      socket.off('onAir');
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
      case 'toggle-onAir':
        socket.emit('set-onAir', !onAir);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className={style.messageContainer}>
        <InputRow
          label='Presenter screen message'
          placeholder='only the presenter screens see this'
          text={pres.text}
          visible={pres.visible}
          changeHandler={(event) => messageControl('pres-text', event)}
          actionHandler={() => messageControl('toggle-pres-visible')}
        />
        <InputRow
          label='Public screen message'
          placeholder='public screens will render this'
          text={publ.text}
          visible={publ.visible}
          changeHandler={(event) => messageControl('publ-text', event)}
          actionHandler={() => messageControl('toggle-publ-visible')}
        />
        <InputRow
          label='Lower third message'
          placeholder='visible in lower third screen'
          text={lower.text}
          visible={lower.visible}
          changeHandler={(event) => messageControl('lower-text', event)}
          actionHandler={() => messageControl('toggle-lower-visible')}
        />
      </div>
      <div className={style.onAirToggle}>
        <Tooltip label={onAir ? 'Disable On Air mode' : 'Enable On Air mode'} openDelay={500}>
          <Switch
            colorScheme='green'
            size='md'
            isChecked={onAir}
            onChange={() => messageControl('toggle-onAir')}
          >
            On Air?
          </Switch>
        </Tooltip>
        <span className={style.oscLabel}>
          {`/ontime/offAir << OSC >> /ontime/onAir`}
        </span>
      </div>
    </>
  );
}
