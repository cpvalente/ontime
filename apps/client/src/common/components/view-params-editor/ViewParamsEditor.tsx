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

import { useLocalStorage } from '../../../common/hooks/useLocalStorage';

import ParamInput from './ParamInput';
import { ParamField } from './types';

import style from './ViewParamsEditor.module.scss';

type ViewParamsObj = { [key: string]: string | FormDataEntryValue };
type SavedViewParams = Record<string, ViewParamsObj>;

const getURLSearchParamsFromObj = (paramsObj: ViewParamsObj) =>
  Object.entries(paramsObj).reduce((newSearchParams, [id, value]) => {
    if (typeof value === 'string' && value.length) {
      newSearchParams.set(id, value);

      return newSearchParams;
    }

    return newSearchParams;
  }, new URLSearchParams());

interface EditFormDrawerProps {
  paramFields: ParamField[];
}

export default function ViewParamsEditor({ paramFields }: EditFormDrawerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onClose, onOpen } = useDisclosure();

  const [storedViewParams, setStoredViewParams] = useLocalStorage<SavedViewParams>('ontime-views', {});

  useEffect(() => {
    const isEditing = searchParams.get('edit');

    if (isEditing === 'true') {
      return onOpen();
    }
  }, [searchParams, onOpen]);

  useEffect(() => {
    const pathname = location.pathname;
    const viewParamsObjFromLocalStorage = storedViewParams[pathname];

    if (viewParamsObjFromLocalStorage !== undefined) {
      const defaultSearchParams = getURLSearchParamsFromObj(viewParamsObjFromLocalStorage);
      setSearchParams(defaultSearchParams);
    }

    // linter is asking for `setSearchParams` in the useEffect deps
    // rule is disabled since adding `setSearchParams` results in unnecessary re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedViewParams]);

  const onEditDrawerClose = () => {
    onClose();

    searchParams.delete('edit');
    setSearchParams(searchParams);
  };

  const clearParams = () => {
    setStoredViewParams({ ...storedViewParams, [location.pathname]: {} });
    setSearchParams();
    onClose();
  };

  const onParamsFormSubmit = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    const newParamsObject = Object.fromEntries(new FormData(formEvent.currentTarget));
    const newSearchParams = getURLSearchParamsFromObj(newParamsObject);

    setStoredViewParams({ ...storedViewParams, [location.pathname]: newParamsObject });
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
          <Button variant='ontime-ghosted' onClick={clearParams} type='reset'>
            Clear
          </Button>
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
