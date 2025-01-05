import { MouseEvent, ReactNode } from 'react';
import { IconButton, IconButtonProps } from '@chakra-ui/react';

import { Tooltip } from '../../../components/ui/tooltip';

interface TooltipActionBtnProps extends IconButtonProps {
  clickHandler: (event: MouseEvent) => void | Promise<void>;
  tooltip: string;
  openDelay?: number;
  icon: ReactNode;
  disabled?: boolean;
}

export default function TooltipActionBtn(props: TooltipActionBtnProps) {
  const { clickHandler, icon, size = 'xs', tooltip, openDelay = 0, className, ...rest } = props;
  return (
    <Tooltip content={tooltip} openDelay={openDelay}>
      <IconButton {...rest} size={size} onClick={clickHandler} className={className}>
        {icon}
      </IconButton>
    </Tooltip>
  );
}
