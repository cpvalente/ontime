import { sanitiseCue } from 'ontime-utils';
import { memo } from 'react';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import Input from '../../../../common/components/input/input/Input';
import Switch from '../../../../common/components/switch/Switch';
import { useEntryActionsContext } from '../../../../common/context/EntryActionsContext';
import EventTextArea from './EventTextArea';
import EntryEditorTextInput from './EventTextInput';

import style from '../EntryEditor.module.scss';

interface EventEditorTitlesProps {
  eventId: string;
  cue: string;
  flag: boolean;
  title: string;
  note: string;
  colour: string;
}

export default memo(EventEditorTitles);
function EventEditorTitles({ eventId, cue, flag, title, note, colour }: EventEditorTitlesProps) {
  const { updateEntry } = useEntryActionsContext();

  const cueSubmitHandler = (_field: string, newValue: string) => {
    updateEntry({ id: eventId, cue: sanitiseCue(newValue) });
  };

  const flagSubmitHandler = (newValue: boolean) => {
    updateEntry({ id: eventId, flag: newValue });
  };

  const textSubmitHandler = (field: string, newValue: string) => {
    updateEntry({ id: eventId, [field]: newValue });
  };

  return (
    <div className={style.column}>
      <Editor.Title>Event Data</Editor.Title>
      <div className={style.splitThree}>
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
        <div>
          <Editor.Label htmlFor='flag'>Flag</Editor.Label>
          <Editor.Label className={style.switchLabel}>
            <Switch id='flag' checked={flag} onCheckedChange={flagSubmitHandler} />
            {flag ? 'On' : 'Off'}
          </Editor.Label>
        </div>
      </div>
      <div>
        <Editor.Label>Colour</Editor.Label>
        <SwatchSelect name='colour' value={colour} handleChange={textSubmitHandler} />
      </div>
      <EntryEditorTextInput field='title' label='Title' initialValue={title} submitHandler={textSubmitHandler} />
      <EventTextArea field='note' label='Note' initialValue={note} submitHandler={textSubmitHandler} />
    </div>
  );
}
