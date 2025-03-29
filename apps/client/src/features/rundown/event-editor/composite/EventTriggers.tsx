import { IoTrash } from 'react-icons/io5';
import { IconButton } from '@chakra-ui/react';
import { timerLifecycleValues, Trigger } from 'ontime-types';

import useAutomationSettings from '../../../../common/hooks-query/useAutomationSettings';
import * as Editor from '../../../editors/editor-utils/EditorUtils';

import style from '../EventEditor.module.scss';

interface EventTriggersProps {
  triggers: Trigger[];
  deleteHandler: (id: string) => void;
}

export default function EventTriggers(props: EventTriggersProps) {
  const { deleteHandler, triggers } = props;
  const { data: automationSettings } = useAutomationSettings();

  const filteredTriggers: Record<string, Trigger[] | undefined> = {};

  timerLifecycleValues.forEach((triggerType) => {
    filteredTriggers[triggerType] = triggers.filter((t) => t.trigger === triggerType);
    if (filteredTriggers[triggerType].length === 0) {
      filteredTriggers[triggerType] = undefined;
    }
  });

  return (
    <div>
      {Object.entries(filteredTriggers).map(([triggerLifeCycle, triggerGroup]) => {
        if (triggerGroup !== undefined) {
          return (
            <>
              <Editor.Label key={triggerLifeCycle} className={style.decorated}>
                {triggerLifeCycle}
              </Editor.Label>
              {triggerGroup.map((trigger) => {
                const { id, automationId } = trigger;
                const automationTitle = automationSettings.automations[automationId]?.title ?? '<MISSING AUTOMATION>';
                return (
                  <div key={id} className={style.trigger}>
                    <span>🠆 {automationTitle}</span>
                    <IconButton
                      size='sm'
                      variant='ontime-ghosted'
                      color='#FA5656' // $red-500
                      icon={<IoTrash />}
                      aria-label='Delete entry'
                      onClick={() => deleteHandler(id)}
                    />
                  </div>
                );
              })}
            </>
          );
        } else {
          return null;
        }
      })}
    </div>
  );
}
