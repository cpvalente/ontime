import { memo, MouseEvent } from 'react';
import { IconButton, IconButtonProps, Tooltip } from '@chakra-ui/react';

interface TooltipActionBtnProps extends IconButtonProps {
  clickHandler: (event: MouseEvent) => void | Promise<void>;
  tooltip: string;
  openDelay?: number;
}

function TooltipActionBtnComponent(props: TooltipActionBtnProps) {
  const { clickHandler, icon, size = 'xs', tooltip, openDelay = 0, className, ...rest } = props;
  return (
    <Tooltip label={tooltip} openDelay={openDelay}>
      <IconButton {...rest} size={size} icon={icon} onClick={clickHandler} className={className} />
    </Tooltip>
  );
}
export default memo(TooltipActionBtnComponent);
