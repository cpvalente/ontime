import { useCallback } from 'react';
import { OntimeMilestone } from 'ontime-types';

import * as Editor from '../../../common/components/editor-utils/EditorUtils';
import SwatchSelect from '../../../common/components/input/colour-input/SwatchSelect';
import Input from '../../../common/components/input/input/Input';
import AppLink from '../../../common/components/link/app-link/AppLink';
import { useEntryActionsContext } from '../../../common/context/EntryActionsContext';
import useCustomFields from '../../../common/hooks-query/useCustomFields';

import EntryEditorCustomFields from './composite/EventEditorCustomFields';
import EventTextArea from './composite/EventTextArea';
import EntryEditorTextInput from './composite/EventTextInput';

import style from './EntryEditor.module.scss';

// cue + title + colour + custom field labels
export type MilestoneEditorUpdateTextFields = 'cue' | 'title' | 'colour' | string;

interface MilestoneEditorProps {
  milestone: OntimeMilestone;
}
export default function MilestoneEditor({ milestone }: MilestoneEditorProps) {
  const { data: customFields } = useCustomFields();
  const { updateEntry } = useEntryActionsContext();

  const handleSubmit = useCallback(
    (field: MilestoneEditorUpdateTextFields, value: string) => {
      // Handle custom fields
      if (typeof field === 'string' && field.startsWith('custom-')) {
        const fieldLabel = field.split('custom-')[1];
        updateEntry({ id: milestone.id, custom: { [fieldLabel]: value } });
        return;
      }
      // all other strings are text fields
      return updateEntry({ id: milestone.id, [field]: value });
    },
    [milestone.id, updateEntry],
  );

  const isEditor = window.location.pathname.includes('editor');

  return (
    <div className={style.content}>
      <div className={style.column}>
        <Editor.Title>Milestone data</Editor.Title>
        <div className={style.splitTwo}>
          <div>
            <Editor.Label htmlFor='entryId'>Milestone ID (read only)</Editor.Label>
            <Input id='entryId' data-testid='input-textfield' value={milestone.id} readOnly fluid />
          </div>
          <EntryEditorTextInput
            field='cue'
            label='Cue'
            initialValue={milestone.cue}
            submitHandler={handleSubmit}
            maxLength={10}
          />
        </div>
        <div>
          <Editor.Label>Colour</Editor.Label>
          <SwatchSelect name='colour' value={milestone.colour} handleChange={handleSubmit} />
        </div>
        <EntryEditorTextInput field='title' label='Title' initialValue={milestone.title} submitHandler={handleSubmit} />
        <EventTextArea field='note' label='Note' initialValue={milestone.note} submitHandler={handleSubmit} />
      </div>

      <div className={style.column}>
        <Editor.Title>
          Custom Fields
          {isEditor && <AppLink search='settings=manage__custom'>Manage Custom Fields</AppLink>}
        </Editor.Title>
        <EntryEditorCustomFields fields={customFields} handleSubmit={handleSubmit} entry={milestone} />
      </div>
    </div>
  );
}
