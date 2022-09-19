import { IconButton } from '@chakra-ui/button';
import { IconButtonProps } from '@chakra-ui/react';
import { Tooltip } from '@chakra-ui/tooltip';

interface TooltipActionBtnProps extends IconButtonProps {
  clickHandler: () => void;
  tooltip: string;
  openDelay?: number;
}

export default function TooltipActionBtn(props: TooltipActionBtnProps) {
  const { clickHandler, icon, size = 'xs', tooltip, openDelay = 0, className, ...rest } = props;
  return (
    <Tooltip label={tooltip} openDelay={openDelay}>
      <IconButton
        {...rest}
        aria-label={tooltip}
        size={size}
        icon={icon}
        onClick={clickHandler}
        className={className}
      />
    </Tooltip>
  );
}
