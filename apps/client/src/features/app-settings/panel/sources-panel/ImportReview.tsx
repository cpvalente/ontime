import { useState } from 'react';
import { Button } from '@mantine/core';
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
}

export default function ImportReview(props: ImportReviewProps) {
  const { rundown, customFields, onFinished } = props;

  const [loading, setLoading] = useState(false);
  const { importRundown } = useGoogleSheet();
  const resetPreview = useSheetStore((state) => state.resetPreview);

  const handleCancel = () => {
    resetPreview();
    onFinished();
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
          <Button onClick={handleCancel} variant='ontime-ghosted' size='sm' disabled={loading}>
            Cancel
          </Button>
          <Button onClick={applyImport} variant='ontime-filled' size='sm' loading={loading}>
            Apply
          </Button>
        </div>
      </Panel.Title>
      <PreviewSpreadsheet rundown={rundown} customFields={customFields} />
    </Panel.Section>
  );
}
