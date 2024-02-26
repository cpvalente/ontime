import { Button } from '@chakra-ui/react';
import { CustomFields, OntimeRundown } from 'ontime-types';

import PreviewSpreadsheet from './preview/PreviewRundown';
import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

import style from './SourcesPanel.module.scss';

interface ImportReviewProps {
  rundown: OntimeRundown;
  customFields: CustomFields;
}

export default function ImportReview({ rundown, customFields }: ImportReviewProps) {
  const { importRundown } = useGoogleSheet();
  const resetPreview = useSheetStore((state) => state.resetPreview);

  const applyImport = () => {
    importRundown(rundown, customFields);
  };

  return (
    <>
      <PreviewSpreadsheet rundown={rundown} customFields={customFields} />
      <div className={style.buttonRow}>
        <Button onClick={resetPreview} variant='ontime-ghosted' size='sm'>
          Cancel
        </Button>
        <Button onClick={applyImport} variant='ontime-filled' size='sm'>
          Apply
        </Button>
      </div>
    </>
  );
}
