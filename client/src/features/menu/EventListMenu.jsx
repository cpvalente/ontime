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

export default function EventListMenu(props) {
  const { eventsHandler } = props;
  const buttonProps = {
    size: 'sm',
    variant: 'outline',
    colorScheme: 'whiteAlpha',
    backgroundColor: '#ffffff05',
  };

  const menuStyle = {
    color: 'initial',
    backgroundColor: 'rgba(255,255,255,0.67)',
  };

  const addHandler = () => {
    eventsHandler('add', { type: 'event', order: 0 });
  };

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
      <AddIconBtn clickHandler={addHandler} size='sm' />
    </div>
  );
}
