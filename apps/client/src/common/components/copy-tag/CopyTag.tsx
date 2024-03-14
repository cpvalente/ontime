import { PropsWithChildren } from 'react';
import { Button, ActionIcon, Tooltip } from '@mantine/core';
import { IoCopy } from '@react-icons/all-files/io5/IoCopy';

import { tooltipDelayFast } from '../../../ontimeConfig';
import { Size } from '../../models/Util.type';
import copyToClipboard from '../../utils/copyToClipboard';

interface CopyTagProps {
  label: string;
  className?: string;
  size?: Size;
  disabled?: boolean;
}

export default function CopyTag(props: PropsWithChildren<CopyTagProps>) {
  const { label, className, size = 'xs', disabled, children } = props;

  const handleClick = () => copyToClipboard(children as string);

  return (
    <Tooltip label={label} openDelay={tooltipDelayFast}>
      <Button.Group className={className}>
        <Button variant='ontime-subtle' tabIndex={-1} disabled={disabled}>
          {children}
        </Button>
        <ActionIcon
          aria-label={label}
          variant='ontime-filled'
          tabIndex={-1}
          onClick={handleClick}
          disabled={disabled}
        >
          <IoCopy />
        </ActionIcon>
      </Button.Group>
    </Tooltip>
  );
}
