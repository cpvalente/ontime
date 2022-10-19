import { IconButton, Tooltip } from '@chakra-ui/react';
import { IoPause } from '@react-icons/all-files/io5/IoPause';

import { tooltipDelayMid } from '../../../ontimeConfig';

interface PauseIconBtnProps {
  clickhandler: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  active: boolean;
  disabled: boolean;
}

export default function PauseIconBtn(props: PauseIconBtnProps) {
  const { clickhandler, active, disabled, ...rest } = props;
  return (
    <Tooltip label='Pause timer' openDelay={tooltipDelayMid} shouldWrapChildren={disabled}>
      <IconButton
        icon={<IoPause size='24px' />}
        colorScheme='orange'
        variant={active ? 'solid' : 'outline'}
        onClick={clickhandler}
        width={120}
        disabled={disabled}
        aria-label='Pause playback'
        {...rest}
      />
    </Tooltip>
  );
}
