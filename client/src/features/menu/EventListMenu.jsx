import { AddIcon, ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import style from './EventListMenu.module.css';

export default function EventListMenu(props) {
  const buttonProps = {
    size: 'sm',
    variant: 'outline',
  };
  return (
    <div className={style.headerButtons}>
      <Menu>
        <ButtonGroup isAttached>
          <Button size='sm' variant='outline'>
            Upload
          </Button>
          <MenuButton as={Button} {...buttonProps}>
            <ChevronDownIcon />
          </MenuButton>
        </ButtonGroup>
        <MenuList>
          <MenuItem>Upload Excel</MenuItem>
          <MenuItem>Upload CSV</MenuItem>
        </MenuList>
      </Menu>
      <Menu>
        <ButtonGroup isAttached>
          <Button {...buttonProps}>Save</Button>
          <MenuButton as={Button} {...buttonProps}>
            <ChevronDownIcon />
          </MenuButton>
        </ButtonGroup>
        <MenuList>
          <MenuItem>Download Excel</MenuItem>
          <MenuItem>Download CSV</MenuItem>
        </MenuList>
      </Menu>
      <IconButton
        size='sm'
        icon={<AddIcon />}
        colorScheme='blue'
        onClick={() => props.createEvent()}
      />
    </div>
  );
}
