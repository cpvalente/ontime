import { SecondarySource } from 'ontime-types';
import { IoEye, IoEyeOffOutline } from 'react-icons/io5';

import IconButton from '../../../common/components/buttons/IconButton';
import Select from '../../../common/components/select/Select';
import { setMessage, useSecondaryMessageInput, useTimerMessageInput } from '../../../common/hooks/useSocket';
import InputRow from './InputRow';
import ScreenControl from './ScreenControl';
import TimerPreview from './TimerPreview';

export default function MessageControl() {
  return (
    <>
      <TimerPreview />
      <ScreenControl />
      <TimerMessageInput />
      <SecondaryInput />
    </>
  );
}

function TimerMessageInput() {
  const { text, visible } = useTimerMessageInput();

  return (
    <InputRow
      label='Timer message'
      placeholder='Message shown fullscreen in stage timer'
      text={text}
      visible={visible}
      changeHandler={(newValue) => setMessage.timerText(newValue)}
    >
      <IconButton
        aria-label='Toggle timer message visibility'
        aria-pressed={visible}
        onClick={() => setMessage.timerVisible(!visible)}
        variant={visible ? 'primary' : 'subtle'}
      >
        {visible ? <IoEye /> : <IoEyeOffOutline />}
      </IconButton>
    </InputRow>
  );
}

/**
 * The secondary line of the stage timer shows one of the aux timers or the secondary message.
 * The select owns which one, the eye owns whether the line is shown at all.
 */
function SecondaryInput() {
  const { text, source } = useSecondaryMessageInput();
  const isShowingSecondaryLine = source !== null;
  const selectedSource = source ?? 'aux1';

  return (
    <InputRow
      label='Secondary'
      placeholder='Message shown as secondary text in stage timer'
      text={text}
      visible={source === 'secondary'}
      changeHandler={(newValue) => setMessage.secondaryMessage(newValue)}
      sourcePicker={
        <Select
          value={selectedSource}
          options={[
            { value: 'aux1', label: 'Aux 1' },
            { value: 'aux2', label: 'Aux 2' },
            { value: 'aux3', label: 'Aux 3' },
            { value: 'secondary', label: 'Message' },
          ]}
          onValueChange={(value: SecondarySource | null) => {
            if (value === null) return;
            setMessage.timerSecondarySource(value);
          }}
        />
      }
    >
      <IconButton
        aria-label='Toggle secondary visibility'
        aria-pressed={isShowingSecondaryLine}
        onClick={() => setMessage.timerSecondarySource(isShowingSecondaryLine ? null : selectedSource)}
        variant={isShowingSecondaryLine ? 'primary' : 'subtle'}
        data-testid='toggle secondary'
      >
        {isShowingSecondaryLine ? <IoEye /> : <IoEyeOffOutline />}
      </IconButton>
    </InputRow>
  );
}
