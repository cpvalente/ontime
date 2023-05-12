import { PropsWithChildren } from 'react';
import { Button, ButtonGroup, IconButton, Tooltip } from '@chakra-ui/react';
import { IoCopy } from '@react-icons/all-files/io5/IoCopy';

import { tooltipDelayFast } from '../../../ontimeConfig';
import { Size } from '../../models/Util.type';

interface CopyTagProps {
  label: string;
  className?: string;
  size?: Size;
}

export default function CopyTag(props: PropsWithChildren<CopyTagProps>) {
  const { label, className, size = 'xs', children } = props;

  const handleClick = () => {
    // we need to this as a promise because safari
    setTimeout(async () => await navigator.clipboard.writeText(children as string));
  };

  return (
    <Tooltip label={label} openDelay={tooltipDelayFast}>
      <ButtonGroup size={size} isAttached className={className}>
        <Button variant='ontime-subtle' tabIndex={-1}>
          {children}
        </Button>
        <IconButton aria-label={label} icon={<IoCopy />} variant='ontime-filled' tabIndex={-1} onClick={handleClick} />
      </ButtonGroup>
    </Tooltip>
  );
}
