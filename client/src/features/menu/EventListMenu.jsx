import { memo, useCallback } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import {
  Button,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import AddIconBtn from '../../common/components/buttons/AddIconBtn';
import style from './EventListMenu.module.css';
import MenuActionButtons from '../editors/list/MenuActionButtons';

const EventListMenu = ({ eventsHandler }) => {
  const buttonProps = {
    size: 'sm',
    variant: 'outline',
    colorScheme: 'whiteAlpha',
    backgroundColor: '#ffffff05',
    _hover: { bg: 'blue.800' },
    _expanded: { bg: 'blue.400' },
    _focus: { boxShadow: 'none' },
  };

  const menuStyle = {
    color: 'initial',
    backgroundColor: 'rgba(255,255,255,0.67)',
  };

  const addHandler = useCallback(() => {
    eventsHandler('add', { type: 'event', order: 0 });
  }, [eventsHandler]);

  return (
    <div className={style.headerButtons}>
      <Menu className={style.menu}>
        <ButtonGroup isAttached>
          <Button {...buttonProps}>Upload</Button>
          <MenuButton as={Button} {...buttonProps}>
            <FiChevronDown />
          </MenuButton>
        </ButtonGroup>
        <MenuList style={menuStyle}>
          <MenuItem>Upload Excel</MenuItem>
          <MenuItem>Upload CSV</MenuItem>
        </MenuList>
      </Menu>
      <Menu>
        <ButtonGroup isAttached>
          <Button {...buttonProps}>Save</Button>
          <MenuButton as={Button} {...buttonProps}>
            <FiChevronDown />
          </MenuButton>
        </ButtonGroup>
        <MenuList style={menuStyle}>
          <MenuItem>Download Excel</MenuItem>
          <MenuItem>Download CSV</MenuItem>
        </MenuList>
      </Menu>
      <AddIconBtn clickhandler={addHandler} size='sm' />
      {/* <MenuActionButtons size='sm' /> */}
    </div>
  );
};

export default memo(EventListMenu);
