import { FormEvent, memo } from 'react';
import { IoClose } from 'react-icons/io5';
import { useSearchParams } from 'react-router';
import { Dialog } from '@base-ui/react/dialog';
import { OntimeView } from 'ontime-types';

import { useIsSmallScreen } from '../../hooks/useIsSmallScreen';
import useViewSettings from '../../hooks-query/useViewSettings';
import Button from '../buttons/Button';
import IconButton from '../buttons/IconButton';
import Info from '../info/Info';

import { ViewOption } from './viewParams.types';
import { getPreservedSearchParams, getURLSearchParamsFromObj } from './viewParams.utils';
import { useViewParamsEditorStore } from './viewParamsEditor.store';
import { ViewParamsPresets } from './ViewParamsPresets';
import ViewParamsSection from './ViewParamsSection';

import style from './ViewParamsEditor.module.scss';

interface EditFormDrawerProps {
  target: OntimeView;
  viewOptions: ViewOption[];
}

export default memo(ViewParamsEditor);
function ViewParamsEditor({ target, viewOptions }: EditFormDrawerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: viewSettings } = useViewSettings();
  const { isOpen, close } = useViewParamsEditorStore();
  const isSmallScreen = useIsSmallScreen();

  const getPreservedParams = () => getPreservedSearchParams(searchParams, viewOptions);

  const handleClose = () => {
    close();
  };

  const resetParams = () => {
    setSearchParams(getPreservedParams());
  };

  const onParamsFormSubmit = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    const newParamsObject = Object.fromEntries(new FormData(formEvent.currentTarget));
    const newSearchParams = getURLSearchParamsFromObj(newParamsObject, viewOptions);
    const preservedParams = getPreservedParams();
    preservedParams.forEach((value, key) => {
      newSearchParams.append(key, value);
    });
    setSearchParams(newSearchParams);

    if (isSmallScreen) {
      close();
    }
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
            <IconButton variant='subtle-white' size='large' data-testid='close-view-params' onClick={handleClose}>
              <IoClose />
            </IconButton>
          </div>
          <div className={style.body}>
            {viewSettings.overrideStyles && (
              <Info className={style.info}>This view style is being modified by a custom CSS file.</Info>
            )}
            <ViewParamsPresets target={target} />
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
            <Button
              variant='primary'
              size='large'
              form='edit-params-form'
              type='submit'
              data-testid='apply-view-params'
            >
              Apply
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
