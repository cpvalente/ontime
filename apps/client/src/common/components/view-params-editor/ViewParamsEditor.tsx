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
import { isSection, ViewOption } from './types';

import style from './ViewParamsEditor.module.scss';

type ViewParamsObj = { [key: string]: string | FormDataEntryValue };

/**
 * Utility remove the # character from a hex string
 */
function sanitiseColour(colour: string) {
  if (colour.startsWith('#')) {
    return colour.substring(1);
  }
  return colour;
}

/**
 * Makes a new URLSearchParams object from the given params object
 */
const getURLSearchParamsFromObj = (paramsObj: ViewParamsObj, paramFields: ViewOption[]) => {
  const newSearchParams = new URLSearchParams();

  // Convert paramFields to an object that contains default values
  const defaultValues: Record<string, string> = {};
  paramFields.forEach((option) => {
    if (!isSection(option)) {
      defaultValues[option.id] = String(option.defaultValue);
    }

    // extract persisted values
    if ('type' in option && option.type === 'persist') {
      newSearchParams.set(option.id, option.value);
    }
  });

  // compare which values are different from the default values
  Object.entries(paramsObj).forEach(([id, value]) => {
    if (typeof value === 'string' && value.length) {
      // we dont know which values contain colours
      // unfortunately this means we run all the strings through the sanitation
      const valueWithoutHash = sanitiseColour(value);
      if (defaultValues[id] !== valueWithoutHash) {
        newSearchParams.set(id, valueWithoutHash);
      }
    }
  });
  return newSearchParams;
};

interface EditFormDrawerProps {
  viewOptions: ViewOption[];
}

// TODO: this is a good candidate for memoisation, but needs the paramFields to be stable
export default function ViewParamsEditor({ viewOptions }: EditFormDrawerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onClose, onOpen } = useDisclosure();

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

    onClose();
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
          <form id='edit-params-form' onSubmit={onParamsFormSubmit}>
            {viewOptions.map((option) => {
              if (isSection(option)) {
                return (
                  <div key={option.section} className={style.section}>
                    {option.section}
                  </div>
                );
              }

              if (option.type === 'persist') {
                return null;
              }

              return (
                <div key={option.title} className={style.fieldSet}>
                  <label className={style.label}>
                    <span className={style.title}>{option.title}</span>
                    <span className={style.description}>{option.description}</span>
                    <ParamInput key={option.title} paramField={option} />
                  </label>
                </div>
              );
            })}
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
