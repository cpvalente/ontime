import { FormEvent, useEffect } from 'react';
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
  useDisclosure,
} from '@chakra-ui/react';

import EditFormInput from './EditFormInput';
import { Field } from './types';

import style from './EditFormDrawer.module.scss';

interface EditFormDrawerProps {
  options: Field[];
}

export default function EditFormDrawer({ options }: EditFormDrawerProps) {
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

  const onParamsFormSubmit = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    const newParamsObject = Object.fromEntries(new FormData(formEvent.currentTarget));
    const newSearchParams = Object.entries(newParamsObject).reduce((newSearchParams, [id, value]) => {
      const isIdABoolean = paramFields.some((field) => field.id === id);

      // special handling for <Switch /> (aka checkboxes)
      // unchecked checkboxes DO NOT have a value
      // checked checkboxes will be 'true' (see <EditFormInput />)
      if (isIdABoolean && value === 'true') {
        newSearchParams.set(id, value);

        return newSearchParams;
      }

      if (typeof value === 'string' && value.length) {
        newSearchParams.set(id, value);

        return newSearchParams;
      }

      return newSearchParams;
    }, new URLSearchParams());

    onEditDrawerClose();
    setSearchParams(newSearchParams);
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
          <form id='edit-params-form' onSubmit={onSettingsSubmit}>
            {options.map((field) => (
              <div key={field.title} className={style.columnSection}>
                <label className={style.label} htmlFor={field.id}>
                  <span className={style.title}>{field.title}</span>
                  <span className={style.description}>{field.description}</span>
                </label>
                <EditFormInput key={field.title} field={field} />
              </div>
            ))}
          </form>
        </DrawerBody>

        <DrawerFooter className={style.drawerFooter}>
          <Button variant='ontime-subtle' onClick={onEditDrawerClose}>
            Cancel
          </Button>
          <Button variant='ontime-filled' form='edit-params-form' type='submit'>
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
