import { PropsWithChildren, useState } from 'react';
import { IoCheckmark } from 'react-icons/io5';
import { IoCopy } from 'react-icons/io5';
import { Group } from '@chakra-ui/react';

import { tooltipDelayFast } from '../../../ontimeConfig';
import { Size } from '../../models/Util.type';
import copyToClipboard from '../../utils/copyToClipboard';
import { Button } from '../ui/button';
import { IconButton } from '../ui/icon-button';
import { Tooltip } from '../ui/tooltip';

interface CopyTagProps {
  copyValue: string;
  label: string;
  size?: Size;
  disabled?: boolean;
  onClick?: () => void;
}

export default function CopyTag(props: PropsWithChildren<CopyTagProps>) {
  const { copyValue, label, size = 'xs', disabled, children, onClick } = props;
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    copyToClipboard(copyValue);
    setCopied(true);

    // reset copied state
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <Tooltip content={label} openDelay={tooltipDelayFast}>
      <Group attached>
        <Button variant='ontime-subtle' tabIndex={-1} onClick={onClick} disabled={disabled} size={size}>
          {children}
        </Button>
        <IconButton
          aria-label={label}
          variant='ontime-filled'
          tabIndex={-1}
          onClick={handleClick}
          disabled={disabled}
          size={size}
        >
          {copied ? <IoCheckmark /> : <IoCopy />}
        </IconButton>
      </Group>
    </Tooltip>
  );
}
