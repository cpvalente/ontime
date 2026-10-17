import { SupportedEntry } from 'ontime-types';
import { IoAdd, IoCloudUploadOutline } from 'react-icons/io5';

import { useTranslation } from '../../../translation/TranslationProvider';
import Button from '../buttons/Button';
import EmptyFill from './EmptyFill';

import style from './EmptyRundown.module.scss';

interface EmptyRundownProps {
  handleAddNew?: (type: SupportedEntry) => void;
  /** when given, the empty state guides the user and offers to import a spreadsheet */
  handleImport?: () => void;
  className?: string;
}

export default function EmptyRundown({ handleAddNew, handleImport, className }: EmptyRundownProps) {
  const { getLocalizedString } = useTranslation();
  return (
    <EmptyFill
      text={handleImport ? 'This rundown is empty' : getLocalizedString('common.no_data')}
      className={className}
    >
      {handleImport && (
        <p className={style.guidance}>
          Add your first event, or import a spreadsheet. Groups let you collect events into sections.
        </p>
      )}
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
          {handleImport && (
            <Button onClick={handleImport} variant='subtle' size='large'>
              <IoCloudUploadOutline />
              Import spreadsheet
            </Button>
          )}
        </div>
      )}
    </EmptyFill>
  );
}
