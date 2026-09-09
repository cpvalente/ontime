import type { Automation, Trigger } from 'ontime-types';
import { useState } from 'react';

import { deleteAutomation } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Dialog from '../../../../common/components/dialog/Dialog';
import Info from '../../../../common/components/info/Info';
import * as Panel from '../../panel-utils/PanelUtils';
import { getLifecycleLabel } from './timerLifecycle';

interface DeleteAutomationDialogProps {
  automation: Automation;
  /** global triggers pointing at this automation, they are deleted along with it */
  attachedTriggers: Trigger[];
  onCancel: () => void;
  onDeleted: () => void;
}

/**
 * Deleting takes the automation's global triggers with it, so say so before it happens rather
 * than leaving the user to discover it in the triggers list.
 *
 * An automation attached to an event is still refused by the server: that reference lives in
 * the rundown and removing it is an edit to the show, not to this panel.
 */
export default function DeleteAutomationDialog({
  automation,
  attachedTriggers,
  onCancel,
  onDeleted,
}: DeleteAutomationDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await deleteAutomation(automation.id);
      onDeleted();
    } catch (error) {
      setError(maybeAxiosError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      isOpen
      onClose={onCancel}
      showBackdrop
      showCloseButton
      title='Delete automation'
      bodyElements={
        <Panel.Section>
          <Panel.Paragraph>
            Delete <strong>{automation.title}</strong>? This cannot be undone.
          </Panel.Paragraph>

          {attachedTriggers.length > 0 && (
            <Info type='warning'>
              <Info.Title>
                {attachedTriggers.length === 1
                  ? 'Its trigger is deleted with it'
                  : `Its ${attachedTriggers.length} triggers are deleted with it`}
              </Info.Title>
              <Info.Body>{attachedTriggers.map((trigger) => getLifecycleLabel(trigger.trigger)).join(', ')}</Info.Body>
            </Info>
          )}

          {error && (
            <Info type='error'>
              <Info.Title>Could not delete this automation</Info.Title>
              <Info.Body>{error}</Info.Body>
              <Info.Footer>
                An automation attached to a single event has to be removed from that event first, in the event editor.
              </Info.Footer>
            </Info>
          )}
        </Panel.Section>
      }
      footerElements={
        <>
          <Button onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant='destructive' onClick={handleDelete} loading={isDeleting}>
            Delete
          </Button>
        </>
      }
    />
  );
}
