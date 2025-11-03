import { useCallback } from 'react';
import { MaybeNumber, OntimeGroup } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import SwatchSelect from '../../../common/components/input/colour-input/SwatchSelect';
import AppLink from '../../../common/components/link/app-link/AppLink';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import { getOffsetState } from '../../../common/utils/offset';
import { cx, enDash, timerPlaceholder } from '../../../common/utils/styleUtils';
import TextLikeInput from '../../../views/cuesheet/cuesheet-table/cuesheet-table-elements/TextLikeInput';

import EntryEditorCustomFields from './composite/EventEditorCustomFields';
import EventTextArea from './composite/EventTextArea';
import EntryEditorTextInput from './composite/EventTextInput';
import TargetDurationInput from './composite/TargetDurationInput';

import style from './EntryEditor.module.scss';

// title + colour + custom field labels
export type GroupEditorUpdateTextFields = 'title' | 'colour' | string;
export type GroupEditorUpdateMaybeNumberFields = 'targetDuration';

interface GroupEditorProps {
  group: OntimeGroup;
}

export default function GroupEditor({ group }: GroupEditorProps) {
  const { data: customFields } = useCustomFields();
  const { updateEntry } = useEntryActions();

  const handleSubmit = useCallback(
    (field: GroupEditorUpdateTextFields | GroupEditorUpdateMaybeNumberFields, value: string | MaybeNumber) => {
      // Handle custom fields
      if (typeof field === 'string' && field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        updateEntry({ id: group.id, custom: { [fieldLabel]: value as string } });
        return;
      }

      if (field === 'targetDuration') {
        return updateEntry({ id: group.id, targetDuration: value as MaybeNumber });
      }

      // all other strings are text fields
      return updateEntry({ id: group.id, [field]: value as string });
    },
    [group.id, updateEntry],
  );

  const isEditor = window.location.pathname.includes('editor');
  const planOffset = group.targetDuration === null ? null : group.duration - group.targetDuration;
  const planOffsetLabel = planOffset !== null ? getOffsetState(planOffset) : null;

  return (
    <div className={style.content}>
      <div className={style.column}>
        <Editor.Title>Group schedule</Editor.Title>
        <div className={style.inline}>
          <div>
            <Editor.Label>First event start</Editor.Label>
            <TextLikeInput className={style.textLikeInput} disabled>
              {millisToString(group.timeStart, { fallback: timerPlaceholder })}
            </TextLikeInput>
          </div>
          <div>
            <Editor.Label>Last event end</Editor.Label>
            <TextLikeInput className={style.textLikeInput} disabled>
              {millisToString(group.timeEnd, { fallback: timerPlaceholder })}
            </TextLikeInput>
          </div>
          <div>
            <Editor.Label htmlFor='duration'>Scheduled duration</Editor.Label>
            <TextLikeInput className={style.textLikeInput} disabled>
              {millisToString(group.duration, { fallback: enDash })}
            </TextLikeInput>
          </div>
        </div>
        <div className={style.inline}>
          <div>
            <Editor.Label htmlFor='eventId'>Plan offset</Editor.Label>
            <TextLikeInput
              offset={planOffsetLabel}
              className={cx([style.textLikeInput, planOffset === null && style.inactive])}
              disabled
            >
              {planOffset !== null && planOffset > 0 ? '+' : ''}
              {millisToString(planOffset, { fallback: enDash })}
            </TextLikeInput>
          </div>
          <TargetDurationInput
            duration={group.duration}
            targetDuration={group.targetDuration}
            submitHandler={handleSubmit}
          />
        </div>
      </div>

      <div className={style.column}>
        <Editor.Title>Group data</Editor.Title>
        <div>
          <Editor.Label>Colour</Editor.Label>
          <SwatchSelect name='colour' value={group.colour} handleChange={handleSubmit} />
        </div>
        <EntryEditorTextInput field='title' label='Title' initialValue={group.title} submitHandler={handleSubmit} />
        <EventTextArea field='note' label='Note' initialValue={group.note} submitHandler={handleSubmit} />
      </div>

      <div className={style.column}>
        <Editor.Title>
          Custom Fields
          {isEditor && <AppLink search='settings=manage__custom'>Manage Custom Fields</AppLink>}
        </Editor.Title>
        <EntryEditorCustomFields fields={customFields} handleSubmit={handleSubmit} entry={group} />
      </div>
    </div>
  );
}
