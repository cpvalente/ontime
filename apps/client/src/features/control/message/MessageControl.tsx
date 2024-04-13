import { Button } from '@chakra-ui/react';
import { IoEye } from '@react-icons/all-files/io5/IoEye';
import { IoEyeOffOutline } from '@react-icons/all-files/io5/IoEyeOffOutline';
import { IoSunny } from '@react-icons/all-files/io5/IoSunny';
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline';

import { setMessage, useMessageControl } from '../../../common/hooks/useSocket';
import { enDash } from '../../../common/utils/styleUtils';

import InputRow from './InputRow';

import style from './MessageControl.module.scss';

const noop = () => undefined;

export default function MessageControl() {
  const message = useMessageControl();
  const blink = message.timer.blink;
  const blackout = message.timer.blackout;
  return (
    <div className={style.messageContainer}>
      <InputRow
        label='Public / Backstage screen message'
        placeholder='Shown in public and backstage screens'
        text={message.public.text || ''}
        visible={message.public.visible || false}
        changeHandler={(newValue) => setMessage.publicText(newValue)}
        actionHandler={() => setMessage.publicVisible(!message.public.visible)}
      />
      <InputRow
        label='Lower third message'
        placeholder='Shown in lower third'
        text={message.lower.text || ''}
        visible={message.lower.visible || false}
        changeHandler={(newValue) => setMessage.lowerText(newValue)}
        actionHandler={() => setMessage.lowerVisible(!message.lower.visible)}
      />
      <InputRow
        label='Timer'
        placeholder='Message shown in stage timer'
        text={message.timer.text || ''}
        visible={message.timer.visible || false}
        changeHandler={(newValue) => setMessage.timerText(newValue)}
        actionHandler={() => setMessage.timerVisible(!message.timer.visible)}
      />
      <div className={style.buttonSection}>
        <Button
          size='sm'
          className={`${blink ? style.blink : ''}`}
          variant={blink ? 'ontime-filled' : 'ontime-subtle'}
          leftIcon={blink ? <IoSunny size='1rem' /> : <IoSunnyOutline size='1rem' />}
          onClick={() => setMessage.timerBlink(!blink)}
          data-testid='toggle timer blink'
        >
          Blink
        </Button>
        <Button
          size='sm'
          className={style.blackoutButton}
          variant={blackout ? 'ontime-filled' : 'ontime-subtle'}
          leftIcon={blackout ? <IoEye size='1rem' /> : <IoEyeOffOutline size='1rem' />}
          onClick={() => setMessage.timerBlackout(!blackout)}
          data-testid='toggle timer blackout'
        >
          Blackout screen
        </Button>
      </div>
      <InputRow
        label='External Message (read only)'
        placeholder={enDash}
        readonly
        text={message.external.text || ''}
        visible={message.external.visible || false}
        changeHandler={noop}
        actionHandler={noop}
      />
    </div>
  );
}
