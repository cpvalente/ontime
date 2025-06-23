import { IoEye, IoEyeOffOutline } from 'react-icons/io5';

import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
import {
  setMessage,
  useExternalMessageInput as useSecondaryMessageInput,
  useTimerMessageInput,
} from '../../../common/hooks/useSocket';
import { tooltipDelayMid } from '../../../ontimeConfig';

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
      <TooltipActionBtn
        clickHandler={() => setMessage.timerVisible(!visible)}
        tooltip={visible ? 'Make invisible' : 'Make visible'}
        aria-label='Toggle timer message visibility'
        openDelay={tooltipDelayMid}
        icon={visible ? <IoEye size='18px' /> : <IoEyeOffOutline size='18px' />}
        variant={visible ? 'ontime-filled' : 'ontime-subtle'}
        size='sm'
      />
    </InputRow>
  );
}

function SecondaryInput() {
  const { text, visible } = useSecondaryMessageInput();

  const toggleSecondary = () => {
    if (visible) {
      setMessage.timerSecondary(null);
    } else {
      setMessage.timerSecondary('secondary');
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
      <TooltipActionBtn
        clickHandler={toggleSecondary}
        tooltip={visible ? 'Make invisible' : 'Make visible'}
        aria-label='Toggle secondary message visibility'
        openDelay={tooltipDelayMid}
        icon={visible ? <IoEye size='18px' /> : <IoEyeOffOutline size='18px' />}
        variant={visible ? 'ontime-filled' : 'ontime-subtle'}
        size='sm'
      />
    </InputRow>
  );
}
