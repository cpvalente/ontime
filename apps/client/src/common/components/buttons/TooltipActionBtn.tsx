import { MouseEvent } from 'react';
import { ActionIcon, ActionIconProps, FloatingPosition, Tooltip } from '@mantine/core';


interface TooltipActionBtnProps extends ActionIconProps {
  clickHandler: (event: MouseEvent) => void | Promise<void>;
  tooltip: string;
  tooltipPosition?: FloatingPosition;
  openDelay?: number;
  icon: React.ReactNode;
}

export default function TooltipActionBtn(props: TooltipActionBtnProps) {
  const { clickHandler, icon, size = 'xs', tooltip, openDelay = 0, tooltipPosition, className, ...rest } = props;
  return (
    <Tooltip label={tooltip} openDelay={openDelay} position={tooltipPosition}>
      <ActionIcon {...rest} size={size} onClick={clickHandler} className={className} variant='transparent'>
        {icon}
      </ActionIcon>
    </Tooltip>
  );
}
