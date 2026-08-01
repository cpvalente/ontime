import { NormalisedAutomation, Trigger } from 'ontime-types';
import { IoPencil, IoTrash, IoWarningOutline } from 'react-icons/io5';

import IconButton from '../../../../common/components/buttons/IconButton';
import Tag from '../../../../common/components/tag/Tag';
import * as Panel from '../../panel-utils/PanelUtils';
import { cycles } from './automationUtils';

interface TriggersListItemProps {
  automations: NormalisedAutomation;
  trigger: Trigger;
  duplicate?: boolean;
  handleEdit: () => void;
  handleDelete: () => void;
}

export default function TriggersListItem(props: TriggersListItemProps) {
  const { automations, trigger, duplicate, handleEdit, handleDelete } = props;

  return (
    <tr data-warn={duplicate}>
      <Panel.InlineElements as='td' relation='inner'>
        {duplicate && (
          <IoWarningOutline
            color='#FFBC56' // $orange-500
          />
        )}
        {trigger.title}
      </Panel.InlineElements>
      <td>
        <Tag>{cycles.find((cycle) => cycle.value === trigger.trigger)?.label}</Tag>
      </td>
      <td>
        <Tag>{automations?.[trigger.automationId]?.title}</Tag>
      </td>
      <Panel.InlineElements align='end' relation='inner' as='td'>
        <IconButton variant='ghosted-white' aria-label='Edit entry' onClick={handleEdit}>
          <IoPencil />
        </IconButton>
        <IconButton variant='ghosted-destructive' aria-label='Delete entry' onClick={handleDelete}>
          <IoTrash />
        </IconButton>
      </Panel.InlineElements>
    </tr>
  );
}
