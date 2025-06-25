import { memo } from 'react';
import { sanitiseCue } from 'ontime-utils';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import Input from '../../../../common/components/input/input/Input';
import { type EventEditorUpdateFields } from '../EventEditor';

import EventTextArea from './EventTextArea';
import EntryEditorTextInput from './EventTextInput';

import style from '../EntryEditor.module.scss';

interface EventEditorTitlesProps {
  eventId: string;
  cue: string;
  title: string;
  note: string;
  colour: string;
  handleSubmit: (field: EventEditorUpdateFields, value: string) => void;
}

export default memo(EventEditorTitles);
function EventEditorTitles({ eventId, cue, title, note, colour, handleSubmit }: EventEditorTitlesProps) {
  const cueSubmitHandler = (_field: string, newValue: string) => {
    handleSubmit('cue', sanitiseCue(newValue));
  };

  return (
    <div className={style.column}>
      <Editor.Title>Event Data</Editor.Title>
      <div className={style.splitTwo}>
        <div>
          <Editor.Label htmlFor='eventId'>Event ID (read only)</Editor.Label>
          <Input id='eventId' data-testid='input-textfield' value={eventId} readOnly fluid />
        </div>
        <EntryEditorTextInput
          field='cue'
          label='Cue'
          initialValue={cue}
          submitHandler={cueSubmitHandler}
          maxLength={10}
        />
      </div>
      <div>
        <Editor.Label>Colour</Editor.Label>
        <SwatchSelect name='colour' value={colour} handleChange={handleSubmit} />
      </div>
      <EntryEditorTextInput field='title' label='Title' initialValue={title} submitHandler={handleSubmit} />
      <EventTextArea field='note' label='Note' initialValue={note} submitHandler={handleSubmit} />
    </div>
  );
}
