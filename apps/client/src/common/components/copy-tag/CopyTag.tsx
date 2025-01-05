import { PropsWithChildren, useState } from 'react';
import { Group, IconButton } from '@chakra-ui/react';
import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';
import { IoCopy } from '@react-icons/all-files/io5/IoCopy';

import { Button } from '../../../components/ui/button';
import { Tooltip } from '../../../components/ui/tooltip';
import { tooltipDelayFast } from '../../../ontimeConfig';
import { Size } from '../../models/Util.type';
import copyToClipboard from '../../utils/copyToClipboard';

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
