import { useState } from 'react';
import { IconButton } from '@chakra-ui/react';
import { IoPencil } from '@react-icons/all-files/io5/IoPencil';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';
import { IoWarningOutline } from '@react-icons/all-files/io5/IoWarningOutline';
import { NormalisedAutomation, TimerLifeCycle } from 'ontime-types';

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
        <IconButton
          size='sm'
          variant='ontime-ghosted'
          color='#e2e2e2' // $gray-200
          icon={<IoPencil />}
          aria-label='Edit entry'
          onClick={() => setIsEditing(true)}
        />
        <IconButton
          size='sm'
          variant='ontime-ghosted'
          color='#FA5656' // $red-500
          icon={<IoTrash />}
          aria-label='Delete entry'
          onClick={handleDelete}
        />
      </Panel.InlineElements>
    </tr>
  );
}
