import { useCallback } from 'react';
import { OntimeBlock } from 'ontime-types';
import { millisToString, parseUserTime } from 'ontime-utils';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import SwatchSelect from '../../../common/components/input/colour-input/SwatchSelect';
import NullableTimeInput from '../../../common/components/input/time-input/NullableTimeInput';
import AppLink from '../../../common/components/link/app-link/AppLink';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import useCustomFields from '../../../common/hooks-query/useCustomFields';
import { getOffsetState } from '../../../common/utils/offset';
import { enDash, timerPlaceholder } from '../../../common/utils/styleUtils';
import TextLikeInput from '../../../views/cuesheet/cuesheet-table/cuesheet-table-elements/TextLikeInput';

import EntryEditorCustomFields from './composite/EventEditorCustomFields';
import EventTextArea from './composite/EventTextArea';
import EntryEditorTextInput from './composite/EventTextInput';

import style from './EntryEditor.module.scss';

// title + colour + custom field labels
export type BlockEditorUpdateTextFields = 'targetDuration' | 'title' | 'colour' | string;
export type BlockEditorUpdateMaybeNumberFields = 'targetDuration';

interface BlockEditorProps {
  block: OntimeBlock;
}

export default function BlockEditor({ block }: BlockEditorProps) {
  const { data: customFields } = useCustomFields();
  const { updateEntry } = useEntryActions();

  const handleSubmit = useCallback(
    (field: BlockEditorUpdateTextFields | BlockEditorUpdateMaybeNumberFields, value: string | boolean) => {
      // Handle custom fields
      if (typeof field === 'string' && field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        updateEntry({ id: block.id, custom: { [fieldLabel]: value as string } });
        return;
      }

      if (field === 'targetDuration') {
        if (value === '') {
          return updateEntry({ id: block.id, targetDuration: null });
        }

        return updateEntry({ id: block.id, targetDuration: parseUserTime(value as string) });
      }

      // all other strings are text fields
      return updateEntry({ id: block.id, [field]: value as string });
    },
    [block.id, updateEntry],
  );

  const isEditor = window.location.pathname.includes('editor');
  const planOffset = typeof block.targetDuration !== 'number' ? null : block.duration - block.targetDuration;
  const planOffsetLabel = planOffset !== null ? getOffsetState(planOffset * -1) : null;

  return (
    <div className={style.content}>
      <div className={style.column}>
        <Editor.Title>Group schedule</Editor.Title>
        <div className={style.inline}>
          <div>
            {
              // TODO: format with user time settings
            }
            <Editor.Label>First event start</Editor.Label>
            <TextLikeInput className={style.textLikeInput}>
              {millisToString(block.timeStart, { fallback: timerPlaceholder })}
            </TextLikeInput>
          </div>
          <div>
            <Editor.Label>Last event end</Editor.Label>
            <TextLikeInput className={style.textLikeInput}>
              {millisToString(block.timeEnd, { fallback: timerPlaceholder })}
            </TextLikeInput>
          </div>
          <div>
            <Editor.Label htmlFor='duration'>Scheduled duration</Editor.Label>
            <TextLikeInput className={style.textLikeInput}>
              {millisToString(block.duration, { fallback: enDash })}
            </TextLikeInput>
          </div>
        </div>
        <div className={style.inline}>
          <div>
            <Editor.Label htmlFor='targetDuration'>Target duration</Editor.Label>
            <NullableTimeInput
              name='targetDuration'
              time={block.targetDuration}
              submitHandler={handleSubmit}
              emptyDisplay={enDash}
            />
          </div>
          <div>
            <Editor.Label htmlFor='eventId'>Plan offset</Editor.Label>
            <TextLikeInput offset={planOffsetLabel} className={style.textLikeInput} tabIndex={-1}>
              {planOffset !== null && planOffset > 0 ? '+' : ''}
              {millisToString(planOffset, { fallback: enDash })}
            </TextLikeInput>
          </div>
        </div>
      </div>

      <div className={style.column}>
        <Editor.Title>Block data</Editor.Title>
        <div>
          <Editor.Label>Colour</Editor.Label>
          <SwatchSelect name='colour' value={block.colour} handleChange={handleSubmit} />
        </div>
        <EntryEditorTextInput field='title' label='Title' initialValue={block.title} submitHandler={handleSubmit} />
        <EventTextArea field='note' label='Note' initialValue={block.note} submitHandler={handleSubmit} />
      </div>

      <div className={style.column}>
        <Editor.Title>
          Custom Fields
          {isEditor && <AppLink search='settings=manage__custom'>Manage Custom Fields</AppLink>}
        </Editor.Title>
        <EntryEditorCustomFields fields={customFields} handleSubmit={handleSubmit} entry={block} />
      </div>
    </div>
  );
}
