import { Button } from '@chakra-ui/react';
import { IoEye } from '@react-icons/all-files/io5/IoEye';
import { IoEyeOffOutline } from '@react-icons/all-files/io5/IoEyeOffOutline';
import { IoSunny } from '@react-icons/all-files/io5/IoSunny';
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline';

import { setMessage, useMessageControl } from '../../../common/hooks/useSocket';

import InputRow from './InputRow';

import style from './MessageControl.module.scss';

export default function MessageControl() {
  const messge = useMessageControl();
  const blink = messge.timer.blink;
  const blackout = messge.timer.blackout;
  return (
    <div className={style.messageContainer}>
      <InputRow
        label='Public / Backstage screen message'
        placeholder='Shown in public and backstage screens'
        text={messge.public.text || ''}
        visible={messge.public.visible || false}
        changeHandler={(newValue) => setMessage.publicText(newValue)}
        actionHandler={() => setMessage.publicVisible(!messge.public.visible)}
      />
      <InputRow
        label='Lower third message'
        placeholder='Shown in lower third'
        text={messge.lower.text || ''}
        visible={messge.lower.visible || false}
        changeHandler={(newValue) => setMessage.lowerText(newValue)}
        actionHandler={() => setMessage.lowerVisible(!messge.lower.visible)}
      />
      <InputRow
        label='Timer'
        placeholder='Message shown in stage timer'
        text={messge.timer.text || ''}
        visible={messge.timer.visible || false}
        changeHandler={(newValue) => setMessage.timerText(newValue)}
        actionHandler={() => setMessage.timerVisible(!messge.timer.visible)}
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
          Blink message
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
        label='External Message'
        placeholder='-'
        readonly
        text={messge.external.text || ''}
        visible={messge.external.visible || false}
        changeHandler={() => undefined}
        actionHandler={() => undefined}
      />
    </div>
  );
}
