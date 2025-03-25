import { PropsWithChildren, useState } from 'react';
import { IoCheckmark } from 'react-icons/io5';
import { IoCopy } from 'react-icons/io5';
import { Button, ButtonGroup, IconButton, Tooltip } from '@chakra-ui/react';

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
    <Tooltip label={label} openDelay={tooltipDelayFast}>
      <ButtonGroup size={size} isAttached>
        <Button variant='ontime-subtle' tabIndex={-1} onClick={onClick} isDisabled={disabled}>
          {children}
        </Button>
        <IconButton
          aria-label={label}
          icon={copied ? <IoCheckmark /> : <IoCopy />}
          variant='ontime-filled'
          tabIndex={-1}
          onClick={handleClick}
          isDisabled={disabled}
        />
      </ButtonGroup>
    </Tooltip>
  );
}
