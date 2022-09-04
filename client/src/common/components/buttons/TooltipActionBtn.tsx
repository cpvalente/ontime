import { IconButton } from '@chakra-ui/button';
import { IconButtonProps } from '@chakra-ui/react';
import { Tooltip } from '@chakra-ui/tooltip';

export type Sizes = 'xs' | 'sm' | 'md' | 'lg';

interface TooltipActionBtnProps extends IconButtonProps {
  clickHandler: () => void;
  tooltip: string;
}

export default function TooltipActionBtn(props: TooltipActionBtnProps) {
  const { clickHandler, icon, size = 'xs', tooltip, className, ...rest } = props;
  return (
    <Tooltip label={tooltip}>
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
