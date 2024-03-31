import { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { CustomFields, OntimeRundown } from 'ontime-types';

import * as Panel from '../PanelUtils';

import PreviewSpreadsheet from './preview/PreviewRundown';
import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

import style from './SourcesPanel.module.scss';

interface ImportReviewProps {
  rundown: OntimeRundown;
  customFields: CustomFields;
  onFinished: () => void;
  onCancel: () => void;
}

export default function ImportReview(props: ImportReviewProps) {
  const { rundown, customFields, onFinished, onCancel } = props;

  const [loading, setLoading] = useState(false);
  const { importRundown } = useGoogleSheet();
  const resetPreview = useSheetStore((state) => state.resetPreview);

  const handleCancel = () => {
    resetPreview();
    onCancel();
  };

  const applyImport = async () => {
    setLoading(true);
    await importRundown(rundown, customFields);
    setLoading(false);
    onFinished();
  };

  return (
    <Panel.Section>
      <Panel.Title>
        Review Rundown
        <div className={style.buttonRow}>
          <Button onClick={handleCancel} variant='ontime-ghosted' size='sm' isDisabled={loading}>
            Cancel
          </Button>
          <Button onClick={applyImport} variant='ontime-filled' size='sm' isLoading={loading}>
            Apply
          </Button>
        </div>
      </Panel.Title>
      <PreviewSpreadsheet rundown={rundown} customFields={customFields} />
    </Panel.Section>
  );
}
