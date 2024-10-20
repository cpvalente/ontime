import { setMessage, useExternalMessageInput, useTimerMessageInput } from '../../../common/hooks/useSocket';

import InputRow from './InputRow';
import TimerControlsPreview from './TimerViewControl';

import { useTranslation } from '../../../translation/TranslationProvider';

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
  const { getLocalizedString } = useTranslation();

  return (
    <InputRow
      label={getLocalizedString('timer.message')}
      placeholder={getLocalizedString('timer.message.plac')}
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

  const { getLocalizedString } = useTranslation();

  return (
    <InputRow
      label={getLocalizedString('timer.external')}
      placeholder={getLocalizedString('timer.external.plac')}
      text={text}
      visible={visible}
      changeHandler={(newValue) => setMessage.externalText(newValue)}
      actionHandler={toggleExternal}
    />
  );
}
