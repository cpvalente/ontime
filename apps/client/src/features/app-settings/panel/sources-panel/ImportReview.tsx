import { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { CustomFields, Rundown } from 'ontime-types';

import * as Panel from '../../panel-utils/PanelUtils';

import PreviewSpreadsheet from './preview/PreviewRundown';
import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

interface ImportReviewProps {
  rundown: Rundown;
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
    await importRundown(
      {
        [rundown.id]: rundown,
      },
      customFields,
    );
    setLoading(false);
    onFinished();
  };

  return (
    <Panel.Section>
      <Panel.Title>
        Review Rundown
        <Panel.InlineElements>
          <Button onClick={handleCancel} variant='ontime-ghosted' size='sm' isDisabled={loading}>
            Cancel
          </Button>
          <Button onClick={applyImport} variant='ontime-filled' size='sm' isLoading={loading}>
            Apply
          </Button>
        </Panel.InlineElements>
      </Panel.Title>
      <PreviewSpreadsheet rundown={rundown} customFields={customFields} />
    </Panel.Section>
  );
}
