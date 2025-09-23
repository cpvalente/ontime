import { useState } from 'react';
import { CustomFields, Rundown } from 'ontime-types';

import Button from '../../../../../common/components/buttons/Button';
import * as Panel from '../../../panel-utils/PanelUtils';

import PreviewSpreadsheet from './preview/PreviewRundown';
import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';
import useRundown from '../../../../../common/hooks-query/useRundown';

interface ImportReviewProps {
  rundown: Rundown;
  customFields: CustomFields;
  onFinished: () => void;
  onCancel: () => void;
}

export default function ImportReview(props: ImportReviewProps) {
  const { rundown, customFields, onFinished, onCancel } = props;
  const { data } = useRundown();
  const { id, title } = data;
  const [loading, setLoading] = useState(false);
  const { importRundown } = useGoogleSheet();
  const resetPreview = useSheetStore((state) => state.resetPreview);

  const handleCancel = () => {
    resetPreview();
    onCancel();
  };

  const applyImport = async () => {
    setLoading(true);

    // we need to import on-top of the currently loaded rundown
    // so the id needs to match
    await importRundown(
      {
        [id]: { ...rundown, id, title },
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
          <Button onClick={handleCancel} variant='ghosted' disabled={loading}>
            Cancel
          </Button>
          <Button onClick={applyImport} variant='primary' loading={loading}>
            Apply
          </Button>
        </Panel.InlineElements>
      </Panel.Title>
      <PreviewSpreadsheet rundown={rundown} customFields={customFields} />
    </Panel.Section>
  );
}
