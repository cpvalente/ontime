import { IoEye, IoEyeOffOutline, IoHelpCircle, IoHelpCircleOutline } from 'react-icons/io5';

import IconButton from '../../../common/components/buttons/IconButton';
import {
  setMessage,
  useExternalMessageInput as useSecondaryMessageInput,
  useQuestionControl,
  useTimerMessageInput,
} from '../../../common/hooks/useSocket';
import InputRow from './InputRow';
import QuestionControl from './QuestionControl';
import TimerControlsPreview from './TimerViewControl';

import style from './MessageControl.module.scss';

export default function MessageControl() {
  return (
    <>
      <TimerControlsPreview />
      <TimerMessageInput />
      <SecondaryInput />
      <QuestionControl />
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
  const { enabled: questionEnabled, answer } = useQuestionControl();

  const toggleSecondary = () => {
    if (visible) {
      setMessage.timerSecondarySource(null);
    } else {
      setMessage.timerSecondarySource('secondary');
      // re-showing after a stale answer re-arms the question, so the target sees fresh buttons
      // again instead of the message silently going out to everyone with no target gating
      if (answer !== null) {
        setMessage.questionEnabled(true);
      }
    }
  };

  const toggleQuestion = () => {
    // an answer is showing (possibly still within its hold window) - dismiss it back to plain mode now,
    // rather than waiting out the server's hold delay
    if (answer !== null) {
      setMessage.dismissQuestion();
      return;
    }
    setMessage.questionEnabled(!questionEnabled);
  };

  const handleSecondaryChange = (newValue: string) => {
    setMessage.secondaryMessage(newValue);
    // editing the question text makes any answer shown against the old text stale
    if (answer !== null) {
      setMessage.questionEnabled(true);
    }
  };

  // matches the ? icon's own active condition, so the label doesn't flip out of sync with it
  // while an answer is still being held on screen
  const questionIsActive = questionEnabled || answer !== null;

  return (
    <InputRow
      label={questionIsActive ? 'Secondary Message (Private Question)' : 'Secondary Message'}
      placeholder='Message shown as secondary text in stage timer'
      text={text}
      visible={visible}
      changeHandler={handleSecondaryChange}
    >
      <div className={style.iconGroup}>
        <IconButton
          aria-label='Toggle whether this message expects a response'
          onClick={toggleQuestion}
          variant={questionIsActive ? 'primary' : 'subtle'}
        >
          {questionIsActive ? <IoHelpCircle /> : <IoHelpCircleOutline />}
        </IconButton>
        <IconButton
          aria-label='Toggle secondary message visibility'
          onClick={toggleSecondary}
          variant={visible ? 'primary' : 'subtle'}
        >
          {visible ? <IoEye /> : <IoEyeOffOutline />}
        </IconButton>
      </div>
    </InputRow>
  );
}
