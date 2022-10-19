import { IconButton, Tooltip } from '@chakra-ui/react';
import { IoMicOffOutline } from '@react-icons/all-files/io5/IoMicOffOutline';
import { IoMicSharp } from '@react-icons/all-files/io5/IoMicSharp';

import { useMessageControlProvider } from '../../../common/hooks/useSocketProvider';
import { tooltipDelayMid } from '../../../ontimeConfig';

import InputRow from './InputRow';

import style from './MessageControl.module.scss';

export default function MessageControl() {
  const { data, setMessage } = useMessageControlProvider();

  return (
    <>
      <div className={style.messageContainer}>
        <InputRow
          label='Timer screen message'
          placeholder='only the presenter screens see this'
          text={data.presenter.text}
          visible={data.presenter.visible}
          changeHandler={(newValue) => setMessage.presenterText(newValue)}
          actionHandler={() => setMessage.presenterVisible(!data.presenter.visible)}
        />
        <InputRow
          label='Public screen message'
          placeholder='public screens will render this'
          text={data.public.text}
          visible={data.public.visible}
          changeHandler={(newValue) => setMessage.publicText(newValue)}
          actionHandler={() => setMessage.publicVisible(!data.public.visible)}
        />
        <InputRow
          label='Lower third message'
          placeholder='visible in lower third screen'
          text={data.lower.text}
          visible={data.lower.visible}
          changeHandler={(newValue) => setMessage.lowerText(newValue)}
          actionHandler={() => setMessage.lowerVisible(!data.lower.visible)}
        />
      </div>
      <div className={style.onAirToggle}>
        <Tooltip label={data.onAir ? 'Go Off Air' : 'Go On Air'} openDelay={tooltipDelayMid}>
          <IconButton
            className={style.btn}
            size='md'
            icon={data.onAir ? <IoMicSharp size='24px' /> : <IoMicOffOutline size='24px' />}
            colorScheme='blue'
            variant={data.onAir ? 'solid' : 'outline'}
            onClick={() => setMessage.onAir(!data.onAir)}
            aria-label='Toggle On Air'
          />
        </Tooltip>
        <span className={style.onAirLabel}>On Air</span>
        <span className={style.oscLabel}>{`/ontime/offAir << OSC >> /ontime/onAir`}</span>
      </div>
    </>
  );
}
