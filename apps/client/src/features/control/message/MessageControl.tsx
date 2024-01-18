import { Button } from '@chakra-ui/react';
import { IoEye } from '@react-icons/all-files/io5/IoEye';
import { IoEyeOffOutline } from '@react-icons/all-files/io5/IoEyeOffOutline';
import { IoSunny } from '@react-icons/all-files/io5/IoSunny';
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline';

import { setMessage, useMessageControl } from '../../../common/hooks/useSocket';

import InputRow from './InputRow';

import style from './MessageControl.module.scss';

export default function MessageControl() {
  const data = useMessageControl();
  const blink = data.timerMessage.blink;
  const blackout = data.timerMessage.blackout;
  return (
    <div className={style.messageContainer}>
      <InputRow
        label='Public / Backstage screen message'
        placeholder='Shown in public and backstage screens'
        text={data.publicMessage.text || ''}
        visible={data.publicMessage.visible || false}
        changeHandler={(newValue) => setMessage.publicText(newValue)}
        actionHandler={() => setMessage.publicVisible(!data.publicMessage.visible)}
      />
      <InputRow
        label='Lower third message'
        placeholder='Shown in lower third'
        text={data.lowerMessage.text || ''}
        visible={data.lowerMessage.visible || false}
        changeHandler={(newValue) => setMessage.lowerText(newValue)}
        actionHandler={() => setMessage.lowerVisible(!data.lowerMessage.visible)}
      />
      <InputRow
        label='Timer'
        placeholder='Message shown in stage timer'
        text={data.timerMessage.text || ''}
        visible={data.timerMessage.visible || false}
        changeHandler={(newValue) => setMessage.presenterText(newValue)}
        actionHandler={() => setMessage.presenterVisible(!data.timerMessage.visible)}
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
        text={data.externalMessage.text || ''}
        visible={data.externalMessage.visible || false}
        changeHandler={() => undefined}
        actionHandler={() => undefined}
      />
    </div>
  );
}
