import { useState } from 'react';
import { IoPencil, IoTrash, IoWarningOutline } from 'react-icons/io5';
import { NormalisedAutomation, TimerLifeCycle } from 'ontime-types';

import IconButton from '../../../../common/components/buttons/IconButton';
import Tag from '../../../../common/components/tag/Tag';
import * as Panel from '../../panel-utils/PanelUtils';

import { cycles } from './automationUtils';
import AutomationForm from './TriggerForm';

interface TriggersListItemProps {
  automations: NormalisedAutomation;
  id: string;
  title: string;
  trigger: TimerLifeCycle;
  automationId: string;
  duplicate?: boolean;
  handleDelete: () => void;
  postSubmit: () => void;
}

export default function TriggersListItem(props: TriggersListItemProps) {
  const { automations, id, title, trigger, automationId, duplicate, handleDelete, postSubmit } = props;
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <tr>
        <td colSpan={99}>
          <AutomationForm
            automations={automations}
            initialId={id}
            initialTitle={title}
            initialTrigger={trigger}
            initialAutomationId={automationId}
            onCancel={() => setIsEditing(false)}
            postSubmit={() => {
              setIsEditing(false);
              postSubmit();
            }}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr data-warn={duplicate}>
      <Panel.InlineElements as='td' relation='inner'>
        {duplicate && (
          <IoWarningOutline
            color='#FFBC56' // $orange-500
          />
        )}
        {title}
      </Panel.InlineElements>
      <td>
        <Tag>{cycles.find((cycle) => cycle.value === trigger)?.label}</Tag>
      </td>
      <td>
        <Tag>{automations?.[automationId]?.title}</Tag>
      </td>
      <Panel.InlineElements align='end' relation='inner' as='td'>
        <IconButton variant='ghosted-white' aria-label='Edit entry' onClick={() => setIsEditing(true)}>
          <IoPencil />
        </IconButton>
        <IconButton variant='ghosted-destructive' aria-label='Delete entry' onClick={handleDelete}>
          <IoTrash />
        </IconButton>
      </Panel.InlineElements>
    </tr>
  );
}
