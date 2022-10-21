import { useCallback, useState } from 'react';
import { IconButton, Tooltip } from '@chakra-ui/react';
import PropTypes from 'prop-types';

export default function TooltipLoadingActionBtn(props) {
  const { clickHandler, icon, size = 'xs', tooltip, ...rest } = props;
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(() => {
    setLoading(true);
    clickHandler();
  }, [clickHandler, setLoading]);

  return (
    <Tooltip label={tooltip} shouldWrapChildren={loading}>
      <IconButton
        aria-label={tooltip}
        size={size}
        icon={icon}
        onClick={handleClick}
        disabled={loading}
        isLoading={loading}
        {...rest}
      />
    </Tooltip>
  );
}

TooltipLoadingActionBtn.propTypes = {
  clickHandler: PropTypes.func,
  icon: PropTypes.element,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  tooltip: PropTypes.string,
};
