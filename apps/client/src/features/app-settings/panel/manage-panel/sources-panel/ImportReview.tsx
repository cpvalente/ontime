import { useState } from 'react';
import { CustomFields, Rundown } from 'ontime-types';
import { getFirstEventNormal, getLastEventNormal, millisToString } from 'ontime-utils';

import Button from '../../../../../common/components/buttons/Button';
import useRundown from '../../../../../common/hooks-query/useRundown';
import * as Panel from '../../../panel-utils/PanelUtils';

import PreviewSpreadsheet from './preview/PreviewRundown';
import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

interface ImportReviewProps {
  rundown: Rundown;
  customFields: CustomFields;
  onFinished: () => void;
  onCancel: () => void;
  onBack: () => void;
}

export default function ImportReview({ rundown, customFields, onFinished, onCancel, onBack }: ImportReviewProps) {
  const { data: currentRundown } = useRundown();
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
        [currentRundown.id]: { ...rundown, id: currentRundown.id, title: currentRundown.title },
      },
      customFields,
    );
    setLoading(false);
    onFinished();
  };

  const { firstEvent } = getFirstEventNormal(rundown.entries, rundown.flatOrder);
  const { lastEvent } = getLastEventNormal(rundown.entries, rundown.flatOrder);

  return (
    <Panel.Section>
      <Panel.Title>
        Review Rundown
        <Panel.InlineElements>
          <Button onClick={handleCancel} variant='ghosted' disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onBack} variant='subtle' disabled={loading}>
            Back
          </Button>
          <Button onClick={applyImport} variant='primary' loading={loading}>
            Apply
          </Button>
        </Panel.InlineElements>
      </Panel.Title>
      <Panel.ListGroup>
        <Panel.ListItem>
          <b>Title</b> {rundown.title}
        </Panel.ListItem>
        <Panel.ListItem>
          <b>Number of entries</b> {rundown.flatOrder.length}
        </Panel.ListItem>
        {firstEvent && (
          <Panel.ListItem>
            <b>Start Time</b> {millisToString(firstEvent.timeStart)}
          </Panel.ListItem>
        )}
        {lastEvent && (
          <Panel.ListItem>
            <b>End Time</b> {millisToString(lastEvent.timeEnd)}
          </Panel.ListItem>
        )}
      </Panel.ListGroup>
      <PreviewSpreadsheet rundown={rundown} customFields={customFields} />
    </Panel.Section>
  );
}
