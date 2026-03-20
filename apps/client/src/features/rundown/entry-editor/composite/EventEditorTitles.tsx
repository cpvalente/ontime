import { sanitiseCue } from 'ontime-utils';
import { memo } from 'react';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import Input from '../../../../common/components/input/input/Input';
import Switch from '../../../../common/components/switch/Switch';
import { useEntryActionsContext } from '../../../../common/context/EntryActionsContext';
import { BooleanTally, switchLabel } from '../multi-edit/multiEditUtils';

import EventTextArea from './EventTextArea';
import EntryEditorTextInput from './EventTextInput';

import style from '../EntryEditor.module.scss';

interface EventEditorTitlesMultiEdit {
  flagIndeterminate: boolean;
  flagTally: BooleanTally;
  colourIndeterminate: boolean;
}

interface EventEditorTitlesProps {
  eventId: string;
  cue: string;
  flag: boolean;
  title: string;
  note: string;
  colour: string;
  titlePlaceholder?: string;
  notePlaceholder?: string;
  onSubmit?: (field: string, value: string | boolean) => void;
  multiEdit?: EventEditorTitlesMultiEdit;
}

export default memo(EventEditorTitles);
function EventEditorTitles({
  eventId,
  cue,
  flag,
  title,
  note,
  colour,
  titlePlaceholder,
  notePlaceholder,
  onSubmit: onSubmitProp,
  multiEdit,
}: EventEditorTitlesProps) {
  const { updateEntry } = useEntryActionsContext();

  const submit = (field: string, value: string | boolean) => {
    if (onSubmitProp) {
      onSubmitProp(field, value);
    } else {
      updateEntry({ id: eventId, [field]: value });
    }
  };

  const cueSubmitHandler = (_field: string, newValue: string) => {
    if (onSubmitProp) {
      onSubmitProp('cue', sanitiseCue(newValue));
    } else {
      updateEntry({ id: eventId, cue: sanitiseCue(newValue) });
    }
  };

  const flagSubmitHandler = (newValue: boolean) => {
    if (multiEdit?.flagIndeterminate) {
      submit('flag', multiEdit.flagTally.majority);
    } else {
      submit('flag', newValue);
    }
  };

  const textSubmitHandler = (field: string, newValue: string) => {
    submit(field, newValue);
  };

  const isMulti = !!multiEdit;

  return (
    <div className={style.column}>
      <Editor.Title>Event Data</Editor.Title>
      <div className={style.splitThree}>
        <div>
          <Editor.Label htmlFor='eventId'>Event ID (read only)</Editor.Label>
          <Input id='eventId' data-testid='input-textfield' value={isMulti ? '' : eventId} readOnly disabled={isMulti} fluid />
        </div>
        {isMulti ? (
          <div>
            <Editor.Label htmlFor='cue'>Cue</Editor.Label>
            <Input id='cue' data-testid='input-textfield' value='' readOnly disabled fluid />
          </div>
        ) : (
          <EntryEditorTextInput
            field='cue'
            label='Cue'
            initialValue={cue}
            submitHandler={cueSubmitHandler}
            maxLength={10}
          />
        )}
        <div>
          <Editor.Label htmlFor='flag'>Flag</Editor.Label>
          <Editor.Label className={style.switchLabel}>
            <Switch
              id='flag'
              checked={flag}
              onCheckedChange={flagSubmitHandler}
              indeterminate={multiEdit?.flagIndeterminate}
            />
            {multiEdit
              ? switchLabel(multiEdit.flagTally, multiEdit.flagIndeterminate, flag)
              : flag
                ? 'On'
                : 'Off'}
          </Editor.Label>
        </div>
      </div>
      <div>
        <Editor.Label>Colour {multiEdit?.colourIndeterminate && <span className={style.hint}>(multiple selected)</span>}</Editor.Label>
        <SwatchSelect name='colour' value={colour} handleChange={textSubmitHandler} />
      </div>
      <EntryEditorTextInput field='title' label='Title' initialValue={title} placeholder={titlePlaceholder} submitHandler={textSubmitHandler} />
      <EventTextArea field='note' label='Note' initialValue={note} placeholder={notePlaceholder} submitHandler={textSubmitHandler} />
    </div>
  );
}
