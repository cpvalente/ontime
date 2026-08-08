import type { Automation, Trigger } from 'ontime-types';
import { useState } from 'react';

import { deleteAutomation } from '../../../../common/api/automation';
import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Dialog from '../../../../common/components/dialog/Dialog';
import Info from '../../../../common/components/info/Info';
import { getLifecycleLabel } from '../../../../common/constants/timerLifecycle';
import * as Panel from '../../panel-utils/PanelUtils';

interface DeleteAutomationDialogProps {
  automation: Automation;
  /** global triggers pointing at this automation, they block the delete server side */
  blockingTriggers: Trigger[];
  onCancel: () => void;
  onDeleted: () => void;
}

/**
 * The server refuses to delete an automation that is still referenced, and the panel used to
 * dump that refusal into a stray row under the table. This dialog confirms first and, on a
 * refusal, names what is blocking it: global triggers to remove from the Global Triggers list,
 * or an event reference to remove from the event editor. It does not delete those triggers for
 * the user — a single extra step there is safer than a delete-then-restore sequence here.
 */
export default function DeleteAutomationDialog({
  automation,
  blockingTriggers,
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

          {blockingTriggers.length > 0 && (
            <Info type='warning'>
              <Info.Title>
                {blockingTriggers.length === 1
                  ? 'One trigger points at this automation'
                  : `${blockingTriggers.length} triggers point at this automation`}
              </Info.Title>
              <Info.Body>
                {blockingTriggers
                  .map((trigger) => `${trigger.title} (${getLifecycleLabel(trigger.trigger)})`)
                  .join(', ')}
              </Info.Body>
              <Info.Footer>Remove them from Global Triggers first, then delete the automation.</Info.Footer>
            </Info>
          )}

          {error && (
            <Info type='error'>
              <Info.Title>Could not delete this automation</Info.Title>
              <Info.Body>{error}</Info.Body>
              <Info.Footer>
                Automations attached to a single event have to be removed from that event first, in the event editor.
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
