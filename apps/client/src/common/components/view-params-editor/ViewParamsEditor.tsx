import { FormEvent, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/react';

import useViewSettings from '../../hooks-query/useViewSettings';
import Info from '../info/Info';
import { Button } from '../ui/button';
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
} from '../ui/drawer';

import { ViewOption } from './types';
import ViewParamsSection from './ViewParamsSection';

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
  paramFields.forEach((section) => {
    section.options.forEach((option) => {
      defaultValues[option.id] = String(option.defaultValue);

      // extract persisted values
      if ('type' in option && option.type === 'persist') {
        newSearchParams.set(option.id, option.value);
      }
    });
  });

  // compare which values are different from the default values
  Object.entries(paramsObj).forEach(([id, value]) => {
    if (typeof value === 'string' && value.length) {
      // we dont know which values contain colours
      // unfortunately this means we run all the strings through the sanitation
      const valueWithoutHash = sanitiseColour(value);
      if (defaultValues[id] !== valueWithoutHash) {
        handleValueString(id, valueWithoutHash);
      }
    }
  });

  /** Utility function contains logic to add a value into the searchParams object */
  function handleValueString(id: string, value: string) {
    const maybeMultipleValues = value.split(',');

    // we need to check if the value contains comma separated list, for the case of the multi-select data
    if (Array.isArray(maybeMultipleValues) && maybeMultipleValues.length > 1) {
      const added = new Set();
      maybeMultipleValues.forEach((v) => {
        if (!added.has(v)) {
          added.add(v);
          newSearchParams.append(id, v);
        }
      });
    } else {
      newSearchParams.set(id, value);
    }
  }
  return newSearchParams;
};

interface EditFormDrawerProps {
  viewOptions: ViewOption[];
}

// TODO: this is a good candidate for memoisation, but needs the paramFields to be stable
export default function ViewParamsEditor({ viewOptions }: EditFormDrawerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: viewSettings } = useViewSettings();

  const { open: isOpen, onClose, onOpen } = useDisclosure();

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

    const newParamsObject: Record<string, string> = {};

    new FormData(formEvent.currentTarget).forEach((value, key) => {
      // handle multi-select values by concating new values
      if (key in newParamsObject) {
        newParamsObject[key] = newParamsObject[key].concat(`,${value}`);
      } else {
        newParamsObject[key] = String(value);
      }
    });

    const newSearchParams = getURLSearchParamsFromObj(newParamsObject, viewOptions);
    setSearchParams(newSearchParams);

    onClose();
  };

  return (
    <DrawerRoot open={isOpen} placement='end' onOpenChange={handleClose} size='lg'>
      <DrawerBackdrop />
      <DrawerContent>
        <DrawerHeader className={style.drawerHeader}>
          Customise
          <DrawerCloseTrigger />
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
    </DrawerRoot>
  );
}
