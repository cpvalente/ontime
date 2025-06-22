import { FormEvent, memo, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { useSearchParams } from 'react-router-dom';
import { Dialog } from '@base-ui-components/react/dialog';
import { useDisclosure } from '@mantine/hooks';

import useViewSettings from '../../hooks-query/useViewSettings';
import Button from '../buttons/Button';
import IconButton from '../buttons/IconButton';
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

  const [isOpen, handlers] = useDisclosure(false);

  // handle opening the drawer
  useEffect(() => {
    const isEditing = searchParams.get('edit');

    if (isEditing === 'true') {
      return handlers.open();
    }
  }, [searchParams, handlers]);

  const handleClose = () => {
    searchParams.delete('edit');
    setSearchParams(searchParams);

    handlers.close();
  };

  const resetParams = () => {
    setSearchParams();
    handlers.close();
  };

  const onParamsFormSubmit = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    const newParamsObject = Object.fromEntries(new FormData(formEvent.currentTarget));
    const newSearchParams = getURLSearchParamsFromObj(newParamsObject, viewOptions);
    setSearchParams(newSearchParams);
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={style.backdrop} />
        <Dialog.Popup className={style.drawer}>
          <div className={style.header}>
            <Dialog.Title>Customise</Dialog.Title>
            <IconButton variant='subtle-white' size='large' onClick={handleClose}>
              <IoClose />
            </IconButton>
          </div>
          <div className={style.body}>
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
          </div>
          <div className={style.footer}>
            <Button variant='subtle' size='large' onClick={resetParams} type='reset'>
              Reset to default
            </Button>
            <Button variant='primary' size='large' form='edit-params-form' type='submit'>
              Save
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
