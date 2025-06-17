import { FormEvent, memo, useEffect } from 'react';
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

import useViewSettings from '../../hooks-query/useViewSettings';
import Info from '../info/Info';

import { ViewOption } from './viewParams.types';
import { getURLSearchParamsFromObj } from './viewParams.utils';
import ViewParamsSection from './ViewParamsSection';

import style from './ViewParamsEditor.module.scss';

interface EditFormDrawerProps {
  viewOptions: ViewOption[];
}

export default memo(ViewParamsEditor);

function ViewParamsEditor({ viewOptions }: EditFormDrawerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: viewSettings } = useViewSettings();

  const { isOpen, onClose, onOpen } = useDisclosure();

  // handle opening the drawer
  useEffect(() => {
    const isEditing = searchParams.get('edit');

    if (isEditing === 'true') {
      return onOpen();
    }
  }, [searchParams, onOpen]);

  const handleClose = () => {
    searchParams.delete('edit');
    setSearchParams(searchParams);

    onClose();
  };

  const resetParams = () => {
    setSearchParams();
    onClose();
  };

  const onParamsFormSubmit = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    const newParamsObject = Object.fromEntries(new FormData(formEvent.currentTarget));
    const newSearchParams = getURLSearchParamsFromObj(newParamsObject, viewOptions);
    setSearchParams(newSearchParams);
  };

  return (
    <Drawer isOpen={isOpen} placement='right' onClose={handleClose} variant='ontime' size='lg'>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader>
          <DrawerCloseButton size='lg' />
          Customise
        </DrawerHeader>

        <DrawerBody>
          {viewSettings.overrideStyles && (
            <Info className={style.info}>This view style is being modified by a custom CSS file.</Info>
          )}
          <form id='edit-params-form' onSubmit={onParamsFormSubmit} className={style.sectionList}>
            {viewOptions.map((section) => (
              <ViewParamsSection
                key={section.title}
                title={section.title}
                collapsible={section.collapsible}
                options={section.options}
              />
            ))}
          </form>
        </DrawerBody>

        <DrawerFooter className={style.drawerFooter}>
          <Button variant='ontime-ghosted' onClick={resetParams} type='reset'>
            Reset to default
          </Button>
          <Button variant='ontime-filled' form='edit-params-form' type='submit'>
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
