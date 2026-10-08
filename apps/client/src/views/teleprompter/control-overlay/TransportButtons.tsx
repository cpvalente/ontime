import type { TeleprompterState } from 'ontime-types';
import { IoAdd, IoLocate, IoPause, IoPlay, IoPlaySkipBack, IoPlaySkipForward, IoRemove } from 'react-icons/io5';

import { speedStep, type TeleprompterPayload } from '../teleprompter.keymap';
import { ControlButton } from './ControlOverlay';

interface TransportButtonsProps {
  transport: TeleprompterState;
  onCommand: (payload: TeleprompterPayload) => void;
}

/** On-screen controls, for an operator without a keyboard */
export default function TransportButtons({ transport, onCommand }: TransportButtonsProps) {
  return (
    <>
      <ControlButton
        label='Previous event (Shift + Up arrow)'
        accessibleLabel='Previous event'
        onPress={() => onCommand('previous')}
        testId='teleprompter-previous'
      >
        <IoPlaySkipBack />
      </ControlButton>
      <ControlButton
        label={transport.playing ? 'Pause (Space)' : 'Play (Space)'}
        accessibleLabel={transport.playing ? 'Pause' : 'Play'}
        onPress={() => onCommand('toggle')}
        testId='teleprompter-play'
      >
        {transport.playing ? <IoPause /> : <IoPlay />}
      </ControlButton>
      <ControlButton
        label='Next event (Shift + Down arrow)'
        accessibleLabel='Next event'
        onPress={() => onCommand('next')}
        testId='teleprompter-next'
      >
        <IoPlaySkipForward />
      </ControlButton>
      <ControlButton
        label='Slower (Left arrow)'
        accessibleLabel='Slower'
        onPress={() => onCommand({ speed: { by: -speedStep } })}
        testId='teleprompter-slower'
      >
        <IoRemove />
      </ControlButton>
      <ControlButton
        label='Faster (Right arrow)'
        accessibleLabel='Faster'
        onPress={() => onCommand({ speed: { by: speedStep } })}
        testId='teleprompter-faster'
      >
        <IoAdd />
      </ControlButton>
      <ControlButton
        label='Back to the loaded event (L)'
        accessibleLabel='Back to the loaded event'
        onPress={() => onCommand('loaded')}
        testId='teleprompter-loaded'
      >
        <IoLocate />
      </ControlButton>
    </>
  );
}
