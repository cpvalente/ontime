import { IconButton, Tooltip } from '@chakra-ui/react';
import { FiUsers } from '@react-icons/all-files/fi/FiUsers';
import PropTypes from 'prop-types';

export default function PublicIconBtn(props) {
  const { actionHandler, active, size = 'xs', ...rest } = props;
  return (
    <Tooltip label={active ? 'Make event private' : 'Make event public'}>
      <IconButton
        size={size}
        icon={<FiUsers />}
        colorScheme='blue'
        variant={active ? 'solid' : 'outline'}
        onClick={() => actionHandler('update', { field: 'isPublic', value: !active })}
        {...rest}
      />
    </Tooltip>
  );
}

PublicIconBtn.propTypes = {
  actionHandler: PropTypes.func,
  active: PropTypes.bool,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
};
