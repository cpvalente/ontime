import { IconButton } from '@chakra-ui/button';
import { Divider } from '@chakra-ui/layout';
import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';
import { Tooltip } from '@chakra-ui/tooltip';
import { FiMinusCircle } from '@react-icons/all-files/fi/FiMinusCircle';
import { FiPlus } from '@react-icons/all-files/fi/FiPlus';
import { FiTrash2 } from '@react-icons/all-files/fi/FiTrash2';
import { IoDuplicateOutline } from '@react-icons/all-files/io5/IoDuplicateOutline';
import { IoTimerOutline } from '@react-icons/all-files/io5/IoTimerOutline';
import PropTypes from 'prop-types';

import { tooltipDelayMid } from '../../../../ontimeConfig';


export default function EventBlockActionMenu(props) {
  const { showAdd, showDelay, showBlock, showClone, actionHandler } = props;

  const menuStyle = {
    color: '#000000',
    backgroundColor: 'rgba(255,255,255,1)',
  };

  const blockBtnStyle = {
    size: 'sm',
    colorScheme: 'blue',
    variant: 'outline',
    borderRadius: '3px',
  };

  return (
    <Menu isLazy lazyBehavior='unmount'>
      <Tooltip label='Add ...' delay={tooltipDelayMid}>
        <MenuButton as={IconButton} aria-label='Options' icon={<FiPlus />}
                    tabIndex={-1} {...blockBtnStyle} />
      </Tooltip>
      <MenuList style={menuStyle}>
        <MenuItem icon={<FiPlus />} onClick={() => actionHandler('event')} isDisabled={!showAdd}>
          Add Event after
        </MenuItem>
        <MenuItem
          icon={<IoTimerOutline />}
          onClick={() => actionHandler('delay')}
          isDisabled={!showDelay}
        >
          Add Delay after
        </MenuItem>
        <MenuItem
          icon={<FiMinusCircle />}
          onClick={() => actionHandler('block')}
          isDisabled={!showBlock}
        >
          Add Block after
        </MenuItem>
        {showClone && (
          <MenuItem
            icon={<IoDuplicateOutline />}
            onClick={() => actionHandler('clone')}
            isDisabled={!showBlock}
          >
            Clone event
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          icon={<FiTrash2 />}
          onClick={() => actionHandler('delete')}
          isDisabled={!showBlock}
          color='red.500'
        >
          Delete event
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

EventBlockActionMenu.propTypes = {
  showAdd: PropTypes.bool,
  showDelay: PropTypes.bool,
  showBlock: PropTypes.bool,
  showClone: PropTypes.bool,
  actionHandler: PropTypes.func,
};
