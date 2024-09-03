import { setMessage, useExternalMessageInput, useTimerMessageInput } from '../../../common/hooks/useSocket';

import InputRow from './InputRow';
import TimerControlsPreview from './TimerViewControl';

export default function MessageControl() {
  return (
    <>
      <TimerControlsPreview />
      <TimerMessageInput />
      <ExternalInput />
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
      actionHandler={() => setMessage.timerVisible(!visible)}
    />
  );
}

function ExternalInput() {
  const { text, visible } = useExternalMessageInput();

  const toggleExternal = () => {
    if (visible) {
      setMessage.timerSecondary(null);
    } else {
      setMessage.timerSecondary('external');
    }
  };

  return (
    <InputRow
      label='External Message'
      placeholder='Message shown as secondary text in stage timer'
      text={text}
      visible={visible}
      changeHandler={(newValue) => setMessage.externalText(newValue)}
      actionHandler={toggleExternal}
    />
  );
}
