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
    <Drawer isOpen={isOpen} placement='right' onClose={onEditDrawerClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Create your account</DrawerHeader>

        <DrawerBody>
          <Input placeholder='Type here...' />
        </DrawerBody>

        <DrawerFooter>
          <Button variant='outline' mr={3} onClick={onEditDrawerClose}>
            Cancel
          </Button>
          <Button colorScheme='blue'>Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
