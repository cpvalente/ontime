import type { Automation, Trigger } from 'ontime-types';
import { useState } from 'react';

import { addTrigger, deleteAutomation, deleteTrigger } from '../../../../common/api/automation';
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
  /** pulls fresh settings after a rollback, so the restored triggers carry their new ids */
  onRefetch: () => Promise<unknown>;
}

/**
 * The server refuses to delete an automation that is still referenced, and the panel used to
 * dump that refusal into a stray row under the table. Global triggers are ours to clean up, so
 * we offer to do it. A reference from a rundown event is not: editing rundown data from a
 * settings screen would be a surprising, hard to undo action, so that stays a block with an
 * explanation of where to go.
 */
export default function DeleteAutomationDialog({
  automation,
  blockingTriggers,
  onCancel,
  onDeleted,
  onRefetch,
}: DeleteAutomationDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  /** set only in the rare case where we could not undo our own trigger deletions */
  const [removeFailed, setRemoveFailed] = useState(false);

  /**
   * Puts back triggers we deleted before the automation turned out to be undeletable.
   * The new triggers get fresh ids, which nothing outside this panel holds on to
   */
  const restoreTriggers = async (removed: Trigger[]) => {
    for (const trigger of removed) {
      try {
        await addTrigger({ title: trigger.title, trigger: trigger.trigger, automationId: trigger.automationId });
      } catch (_error) {
        setRemoveFailed(true);
      }
    }
  };

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    // the server reports the trigger references first, so an event reference only surfaces
    // once the triggers are gone. Track them so a refusal does not cost the user their triggers
    const removed: Trigger[] = [];

    try {
      for (const trigger of blockingTriggers) {
        await deleteTrigger(trigger.id);
        removed.push(trigger);
      }
      await deleteAutomation(automation.id);
      onDeleted();
    } catch (error) {
      setError(maybeAxiosError(error));
      if (removed.length > 0) {
        await restoreTriggers(removed);
        // the restored triggers have new ids, the dialog needs them before a second attempt
        await onRefetch();
      }
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
                  ? 'One trigger will be deleted with it'
                  : `${blockingTriggers.length} triggers will be deleted with it`}
              </Info.Title>
              <Info.Body>
                {blockingTriggers
                  .map((trigger) => `${trigger.title} (${getLifecycleLabel(trigger.trigger)})`)
                  .join(', ')}
              </Info.Body>
            </Info>
          )}

          {error && (
            <Info type='error'>
              <Info.Title>Could not delete this automation</Info.Title>
              <Info.Body>{error}</Info.Body>
              <Info.Footer>
                Automations attached to a single event have to be removed from that event first, in the event editor.
                {removeFailed
                  ? ' Your triggers could not be put back, you will need to recreate them.'
                  : ' Nothing was deleted.'}
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
            {blockingTriggers.length > 0 ? 'Delete triggers and automation' : 'Delete'}
          </Button>
        </>
      }
    />
  );
}
