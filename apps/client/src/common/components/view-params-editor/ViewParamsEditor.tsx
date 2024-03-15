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

import ParamInput from './ParamInput';
import { ParamField } from './types';

import style from './ViewParamsEditor.module.scss';

type ViewParamsObj = { [key: string]: string | FormDataEntryValue };

const getURLSearchParamsFromObj = (paramsObj: ViewParamsObj, paramFields: ParamField[]) => {
  const defaultValues = paramFields.reduce<Record<string, string>>((acc, { id, defaultValue }) => {
    return { ...acc, [id]: String(defaultValue) };
  }, {});
  return Object.entries(paramsObj).reduce((newSearchParams, [id, value]) => {
    if (typeof value === 'string' && value.length) {
      if (defaultValues[id] === value) {
        return newSearchParams;
      }
      newSearchParams.set(id, value);

      return newSearchParams;
    }

    return newSearchParams;
  }, new URLSearchParams());
};

interface EditFormDrawerProps {
  paramFields: ParamField[];
}

export default function ViewParamsEditor({ paramFields }: EditFormDrawerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onClose, onOpen } = useDisclosure();

  useEffect(() => {
    const isEditing = searchParams.get('edit');

    if (isEditing === 'true') {
      return onOpen();
    }
  }, [searchParams, onOpen]);

  const onCloseWithoutSaving = () => {
    onClose();

    searchParams.delete('edit');
    setSearchParams(searchParams);
  };

  const resetParams = () => {
    setSearchParams();
  };

  const onParamsFormSubmit = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    const newParamsObject = Object.fromEntries(new FormData(formEvent.currentTarget));
    const newSearchParams = getURLSearchParamsFromObj(newParamsObject, paramFields);
    setSearchParams(newSearchParams);
  };

  return (
    <Drawer isOpen={isOpen} placement='right' onClose={onCloseWithoutSaving} size='lg'>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader className={style.drawerHeader}>
          <DrawerCloseButton _hover={{ bg: '#ebedf0', color: '#333' }} size='lg' />
          Customise
        </DrawerHeader>

        <DrawerBody className={style.drawerContent}>
          <form id='edit-params-form' onSubmit={onParamsFormSubmit}>
            {paramFields.map((field) => (
              <div key={field.title} className={style.columnSection}>
                <label className={style.label}>
                  <span className={style.title}>{field.title}</span>
                  <span className={style.description}>{field.description}</span>
                  <ParamInput key={field.title} paramField={field} />
                </label>
              </div>
            ))}
          </form>
        </DrawerBody>

        <DrawerFooter className={style.drawerFooter}>
          <Button variant='ontime-ghosted' onClick={resetParams} type='reset'>
            Reset
          </Button>
          <Button variant='ontime-subtle' onClick={onCloseWithoutSaving}>
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
