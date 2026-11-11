import { RenumberCues } from 'ontime-types';
import { useForm } from 'react-hook-form';
import { create } from 'zustand';

import { maybeAxiosError } from '../../../common/api/utils';
import Button from '../../../common/components/buttons/Button';
import Dialog from '../../../common/components/dialog/Dialog';
import Input from '../../../common/components/input/input/Input';
import { useEntryActionsContext } from '../../../common/context/EntryActionsContext';
import { useRundownScope } from '../../../common/context/RundownScopeContext';
import useRundown from '../../../common/hooks-query/useRundown';
import { orderEntries } from '../rundown.utils';
import { useEventSelection } from '../useEventSelection';

import style from './RenumberCuesDialog.module.scss';

type RenumberCueData = Pick<RenumberCues, 'increment' | 'prefix' | 'start'>;

export default function RenumberCuesDialog() {
  'use memo';
  const { data } = useRundown();
  const { flatOrder } = data;
  const { scopeId } = useRundownScope();
  const onClose = useRenumberCuesDialogStore((state) => state.onClose);
  const isOpen = useRenumberCuesDialogStore((state) => state.openScopeId === scopeId);
  const { renumberCues } = useEntryActionsContext();
  const selectedEvents = useEventSelection((state) => state.selectedEvents);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RenumberCueData>();

  const onSubmit = async (data: RenumberCueData) => {
    clearErrors();
    try {
      const { prefix, start, increment } = data;
      const orderedEvents = orderEntries(Array.from(selectedEvents), flatOrder);
      await renumberCues(orderedEvents, prefix, start, increment);
      onClose();
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title='Renumber cues'
      showCloseButton
      showBackdrop
      bodyElements={
        <form id='renumber-cues-form' onSubmit={handleSubmit(onSubmit)} className={style.fields}>
          <div className={style.field}>
            <label className={style.label}>
              Prefix
              <Input
                {...register('prefix')}
                type='text'
                maxLength={8}
                height='large'
                fluid
                autoComplete='off'
                placeholder='A'
              />
            </label>
          </div>
          <div className={style.field}>
            <label className={style.label}>
              Start
              <Input
                {...register('start')}
                type='number'
                required
                step={0.001}
                height='large'
                fluid
                autoComplete='off'
                placeholder='10'
              />
            </label>
          </div>
          <div className={style.field}>
            <label className={style.label}>
              Increment
              <Input
                {...register('increment')}
                type='number'
                required
                step={0.001}
                height='large'
                fluid
                autoComplete='off'
                placeholder='0.1'
              />
            </label>
          </div>
          {errors.root && <p className={style.error}>{errors.root.message}</p>}
        </form>
      }
      footerElements={
        <>
          <Button type='button' variant='subtle-white' onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type='submit' variant='primary' form='renumber-cues-form' loading={isSubmitting}>
            Renumber
          </Button>
        </>
      }
    />
  );
}

interface RenumberCuesDialogState {
  /** the scope which opened the dialog, each rundown on screen mounts its own */
  openScopeId: string | null;
  onClose: () => void;
  onOpen: (scopeId: string) => void;
}

export const useRenumberCuesDialogStore = create<RenumberCuesDialogState>()((set) => ({
  openScopeId: null,
  onClose: () => {
    set({ openScopeId: null });
  },
  onOpen: (scopeId) => {
    set({ openScopeId: scopeId });
  },
}));
