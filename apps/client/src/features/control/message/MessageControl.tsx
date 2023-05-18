import { Button } from '@chakra-ui/react';
import { IoMicOffOutline } from '@react-icons/all-files/io5/IoMicOffOutline';
import { IoMicSharp } from '@react-icons/all-files/io5/IoMicSharp';

import { setMessage, useMessageControl } from '../../../common/hooks/useSocket';

import InputRow from './InputRow';

import style from './MessageControl.module.scss';

export default function MessageControl() {
  const data = useMessageControl();

  return (
    <div className={style.messageContainer}>
      <InputRow
        label='Timer screen message'
        placeholder='Shown in stage timer'
        text={data.timerMessage.text || ''}
        visible={data.timerMessage.visible || false}
        changeHandler={(newValue) => setMessage.presenterText(newValue)}
        actionHandler={() => setMessage.presenterVisible(!data.timerMessage.visible)}
      />
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
      <div className={style.onAirSection}>
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
