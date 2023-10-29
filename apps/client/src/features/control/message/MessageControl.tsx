import { Button } from '@chakra-ui/react';
import { IoEye } from '@react-icons/all-files/io5/IoEye';
import { IoEyeOffOutline } from '@react-icons/all-files/io5/IoEyeOffOutline';
import { IoMicOffOutline } from '@react-icons/all-files/io5/IoMicOffOutline';
import { IoMicSharp } from '@react-icons/all-files/io5/IoMicSharp';
import { IoSunny } from '@react-icons/all-files/io5/IoSunny';
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline';

import { setMessage, useMessageControl } from '../../../common/hooks/useSocket';

import InputRow from './InputRow';

import style from './MessageControl.module.scss';

export default function MessageControl() {
  const data = useMessageControl();

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
        label='Timer message'
        placeholder='Shown in stage timer'
        text={data.timerMessage.text || ''}
        visible={data.timerMessage.visible || false}
        changeHandler={(newValue) => setMessage.presenterText(newValue)}
        actionHandler={() => setMessage.presenterVisible(!data.timerMessage.visible)}
      />
      <div className={style.buttonSection}>
        <label className={style.label}>Timer message blink</label>
        <label className={style.label}>Blackout timer screens</label>
        <Button
          className={`${data.timerMessage.timerBlink ? style.blink : ''}`}
          variant={data.timerMessage.timerBlink ? 'ontime-filled' : 'ontime-subtle'}
          leftIcon={data.timerMessage.timerBlink ? <IoSunny size='24px' /> : <IoSunnyOutline size='24px' />}
          onClick={() => setMessage.timerBlink(!data.timerMessage.timerBlink)}
          data-testid='toggle timer blink'
        />
        <Button
          className={style.blackoutButton}
          variant={data.timerMessage.timerBlackout ? 'ontime-filled' : 'ontime-subtle'}
          leftIcon={data.timerMessage.timerBlackout ? <IoEye size='24px' /> : <IoEyeOffOutline size='24px' />}
          onClick={() => setMessage.timerBlackout(!data.timerMessage.timerBlackout)}
          data-testid='toggle timer blackout'
        />
      </div>
      <div className={`${style.onAirSection} ${style.padTop}`}>
        <label className={style.label}>Toggle On Air state</label>
        <Button
          variant={data.onAir ? 'ontime-filled' : 'ontime-subtle'}
          leftIcon={data.onAir ? <IoMicSharp size='24px' /> : <IoMicOffOutline size='24px' />}
          onClick={() => setMessage.onAir(!data.onAir)}
          data-testid='toggle on air'
        >
          {data?.onAir ? 'Ontime is On Air' : 'Ontime is Off Air'}
        </Button>
      </div>
    </div>
  );
}
