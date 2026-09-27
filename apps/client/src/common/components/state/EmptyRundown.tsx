import { SupportedEntry } from 'ontime-types';
import { IoAdd } from 'react-icons/io5';

import { useTranslation } from '../../../translation/TranslationProvider';
import Button from '../buttons/Button';
import EmptyFill from './EmptyFill';

import style from './EmptyRundown.module.scss';

interface EmptyRundownProps {
  handleAddNew?: (type: SupportedEntry) => void;
  className?: string;
}

export default function EmptyRundown({ handleAddNew, className }: EmptyRundownProps) {
  const { getLocalizedString } = useTranslation();
  return (
    <EmptyFill text={getLocalizedString('common.no_data')} className={className}>
      {handleAddNew && (
        <div className={style.inline}>
          <Button onClick={() => handleAddNew(SupportedEntry.Event)} variant='primary' size='large'>
            <IoAdd />
            Create Event
          </Button>
          <Button onClick={() => handleAddNew(SupportedEntry.Group)} variant='primary' size='large'>
            <IoAdd />
            Create Group
          </Button>
        </div>
      )}
    </EmptyFill>
  );
}
