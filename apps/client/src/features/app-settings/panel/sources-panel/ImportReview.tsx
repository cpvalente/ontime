import { Button } from '@chakra-ui/react';
import { OntimeRundown, UserFields } from 'ontime-types';

import PreviewExcel from '../../../modals/upload-modal/preview/PreviewExcel';

import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

import style from './SourcesPanel.module.scss';

interface ImportReviewProps {
  rundown: OntimeRundown;
  userFields: UserFields;
}

export default function ImportReview({ rundown, userFields }: ImportReviewProps) {
  const { handleImport } = useGoogleSheet();
  const resetPreview = useSheetStore((state) => state.resetPreview);

  const applyImport = () => {
    handleImport(rundown, userFields);
  };

  return (
    <>
      <PreviewExcel rundown={rundown} userFields={userFields} />
      <div className={style.buttonRow}>
        <Button onClick={applyImport} variant='ontime-ghosted' size='sm'>
          Cancel
        </Button>
        <Button onClick={resetPreview} variant='ontime-filled' size='sm'>
          Apply
        </Button>
      </div>
    </>
  );
}
