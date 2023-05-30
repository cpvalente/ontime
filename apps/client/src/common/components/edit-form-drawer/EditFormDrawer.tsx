import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Input,
  useDisclosure,
} from '@chakra-ui/react';

import style from './EditFormDrawer.module.scss';

export const EditFormDrawer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onClose, onOpen } = useDisclosure();

  useEffect(() => {
    const isEditing = searchParams.get('edit');

    if (isEditing === 'true') {
      return onOpen();
    }
  }, [searchParams, onOpen]);

  const onEditDrawerClose = () => {
    onClose();

    searchParams.delete('edit');
    setSearchParams(searchParams);
  };

  return (
    <Drawer isOpen={isOpen} placement='right' onClose={onEditDrawerClose} size='lg'>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader className={style.drawerHeader}>
          <DrawerCloseButton _hover={{ bg: '#ebedf0', color: '#333' }} size='lg' />
          Customise
        </DrawerHeader>

        <DrawerBody className={style.drawerContent}>
          <Input placeholder='Type here...' variant='ontime-filled' />
        </DrawerBody>

        <DrawerFooter className={style.drawerContent}>
          <Button variant='outline' mr={3} onClick={onEditDrawerClose}>
            Cancel
          </Button>
          <Button colorScheme='blue'>Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
