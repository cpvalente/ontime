import { useState } from 'react';
import { CustomFields, OntimeRundown } from 'ontime-types';

import { Button } from '../../../../common/components/ui/button';
import * as Panel from '../../panel-utils/PanelUtils';

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
