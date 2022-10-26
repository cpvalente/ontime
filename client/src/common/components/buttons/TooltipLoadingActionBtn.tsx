import { useCallback, useState } from 'react';
import { IconButton, IconButtonProps, Tooltip } from '@chakra-ui/react';

interface TooltipLoadingActionBtnProps extends IconButtonProps {
  clickHandler: () => void;
  tooltip: string;
  openDelay?: number;
}

export default function TooltipLoadingActionBtn(props: TooltipLoadingActionBtnProps) {
  const { clickHandler, icon, size = 'xs', tooltip, openDelay = 0, ...rest } = props;
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(() => {
    setLoading(true);
    clickHandler();
  }, [clickHandler, setLoading]);

  return (
    <Tooltip label={tooltip} shouldWrapChildren={loading} openDelay={openDelay}>
      <IconButton
        {...rest}
        aria-label={tooltip}
        size={size}
        icon={icon}
        onClick={handleClick}
        disabled={loading}
        isLoading={loading}
      />
    </Tooltip>
  );
}

