import { IoEye, IoEyeOffOutline } from 'react-icons/io5';

import IconButton from '../../../common/components/buttons/IconButton';
import {
  setMessage,
  useExternalMessageInput as useSecondaryMessageInput,
  useTimerMessageInput,
} from '../../../common/hooks/useSocket';
import InputRow from './InputRow';
import TimerControlsPreview from './TimerViewControl';

export default function MessageControl() {
  return (
    <>
      <TimerControlsPreview />
      <TimerMessageInput />
      <SecondaryInput />
    </>
  );
}

function TimerMessageInput() {
  const { text, visible } = useTimerMessageInput();

  return (
    <InputRow
      label='Timer Message'
      placeholder='Message shown fullscreen in stage timer'
      text={text}
      visible={visible}
      changeHandler={(newValue) => setMessage.timerText(newValue)}
    >
      <IconButton
        aria-label='Toggle timer message visibility'
        onClick={() => setMessage.timerVisible(!visible)}
        variant={visible ? 'primary' : 'subtle'}
      >
        {visible ? <IoEye /> : <IoEyeOffOutline />}
      </IconButton>
    </InputRow>
  );
}

function SecondaryInput() {
  const { text, visible } = useSecondaryMessageInput();

  const toggleSecondary = () => {
    if (visible) {
      setMessage.timerSecondarySource(null);
    } else {
      setMessage.timerSecondarySource('secondary');
    }
  };

  return (
    <InputRow
      label='Secondary Message'
      placeholder='Message shown as secondary text in stage timer'
      text={text}
      visible={visible}
      changeHandler={(newValue) => setMessage.secondaryMessage(newValue)}
    >
      <IconButton
        aria-label='Toggle secondary message visibility'
        onClick={toggleSecondary}
        variant={visible ? 'primary' : 'subtle'}
      >
        {visible ? <IoEye /> : <IoEyeOffOutline />}
      </IconButton>
    </InputRow>
  );
}
