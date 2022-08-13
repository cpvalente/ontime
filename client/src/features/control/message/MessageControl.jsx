import React from 'react';
import { IconButton } from '@chakra-ui/button';
import { Tooltip } from '@chakra-ui/tooltip';
import { IoMicOffOutline } from '@react-icons/all-files/io5/IoMicOffOutline';
import { IoMicSharp } from '@react-icons/all-files/io5/IoMicSharp';

import { useMessageControlProvider } from '../../../common/hooks/useSocketProvider';

import InputRow from './InputRow';

import style from './MessageControl.module.scss';

export default function MessageControl() {
  const { data, patch } = useMessageControlProvider();

  return (
    <>
      <div className={style.messageContainer}>
        <InputRow
          label='Timer screen message'
          placeholder='only the presenter screens see this'
          text={data.presenter.text}
          visible={data.presenter.visible}
          changeHandler={(newValue) => patch('pres-text', newValue)}
          actionHandler={() => patch('toggle-pres-visible', !data.presenter.visible)}
        />
        <InputRow
          label='Public screen message'
          placeholder='public screens will render this'
          text={data.public.text}
          visible={data.public.visible}
          changeHandler={(newValue) => patch('publ-text', newValue)}
          actionHandler={() => patch('toggle-publ-visible', !data.public.visible)}
        />
        <InputRow
          label='Lower third message'
          placeholder='visible in lower third screen'
          text={data.lower.text}
          visible={data.lower.visible}
          changeHandler={(newValue) => patch('lower-text', newValue)}
          actionHandler={() => patch('toggle-lower-visible', !data.lower.visible)}
        />
      </div>
      <div className={style.onAirToggle}>
        <Tooltip label={data.onAir ? 'Go Off Air' : 'Go On Air'} openDelay={500}>
          <IconButton
            className={style.btn}
            size='md'
            icon={data.onAir ? <IoMicSharp size='24px' /> : <IoMicOffOutline size='24px' />}
            colorScheme='blue'
            variant={data.onAir ? 'solid' : 'outline'}
            onClick={() => patch('toggle-onAir', !data.onAir)}
            aria-label='Toggle On Air'
          />
        </Tooltip>
        <span className={style.onAirLabel}>On Air</span>
        <span className={style.oscLabel}>{`/ontime/offAir << OSC >> /ontime/onAir`}</span>
      </div>
    </>
  );
}
