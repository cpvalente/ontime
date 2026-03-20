import { FormEvent, useState } from 'react';
import { create } from 'zustand';

import { maybeAxiosError } from '../../../common/api/utils';
import Button from '../../../common/components/buttons/Button';
import Dialog from '../../../common/components/dialog/Dialog';
import Input from '../../../common/components/input/input/Input';
import { useEntryActionsContext } from '../../../common/context/EntryActionsContext';
import useRundown from '../../../common/hooks-query/useRundown';
import { orderEntries } from '../rundown.utils';
import { useEventSelection } from '../useEventSelection';
import { validateIncrementInput, validateStartInput } from './renumber.utils';

import style from './RenumberCuesDialog.module.scss';

export default function RenumberCuesDialog() {
  'use memo';
  const { data } = useRundown();
  const { flatOrder } = data;
  const { isOpen, onClose } = useRenumberCuesDialogStore();
  const { renumberCues } = useEntryActionsContext();
  const selectedEvents = useEventSelection((state) => state.selectedEvents);
  const [prefix, setPrefix] = useState('');
  const [startStr, setStartStr] = useState('1');
  const [incrementStr, setIncrementStr] = useState('1');
  const [startError, setStartError] = useState<string | null>(null);
  const [incrementError, setIncrementError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const orderedEvents = orderEntries(Array.from(selectedEvents), flatOrder);
    const startValidation = validateStartInput(startStr);
    const incrementValidation = validateIncrementInput(startStr);
    setStartError(startValidation);
    setIncrementError(incrementValidation);
    if (startValidation || incrementValidation) return;

    setLoading(true);
    try {
      await renumberCues(orderedEvents, prefix, startStr.trim(), incrementStr.trim());
      onClose();
    } catch (error) {
      const errorMessage = maybeAxiosError(error);
      setError(errorMessage);
    } finally {
      setLoading(false);
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
        <form id='renumber-cues-form' onSubmit={handleSubmit} className={style.fields}>
          <div className={style.field}>
            <label htmlFor='renumber-prefix'>Prefix</label>
            <Input
              id='renumber-prefix'
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              height='large'
              fluid
              autoComplete='off'
            />
          </div>
          <InputWithError
            label='Start'
            value={startStr}
            error={startError}
            onChange={(value) => {
              setStartStr(value);
              setStartError(validateStartInput(value));
            }}
          />
          <InputWithError
            label='Increment'
            value={incrementStr}
            error={incrementError}
            onChange={(value) => {
              setIncrementStr(value);
              setIncrementError(validateIncrementInput(value));
            }}
          />
          {error && <p className={style.error}>{error}</p>}
        </form>
      }
      footerElements={
        <>
          <Button type='button' variant='subtle-white' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type='submit' variant='primary' form='renumber-cues-form' loading={loading}>
            Renumber
          </Button>
        </>
      }
    />
  );
}

interface RenumberCuesDialogState {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const useRenumberCuesDialogStore = create<RenumberCuesDialogState>()((set) => ({
  isOpen: false,
  onClose: () => {
    set({ isOpen: false });
  },
  onOpen: () => {
    set({ isOpen: true });
  },
}));

interface InputProps {
  label: string;
  value: string;
  error: string | null;
  onChange: (val: string) => void;
}

function InputWithError({ onChange, value, error, label }: InputProps) {
  return (
    <div className={style.field}>
      <label>{label}</label>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        height='large'
        fluid
        autoComplete='off'
        inputMode='numeric'
        className={error !== null ? style.inputInvalid : undefined}
      />
      <div className={style.fieldErrorSlot} aria-live='polite'>
        {error && (
          <div className={style.fieldError} role='alert'>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
