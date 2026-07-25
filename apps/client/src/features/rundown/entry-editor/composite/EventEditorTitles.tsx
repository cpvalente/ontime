import { OntimeEvent } from 'ontime-types';
import { memo } from 'react';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import Input from '../../../../common/components/input/input/Input';
import Switch from '../../../../common/components/switch/Switch';
import { enDash } from '../../../../common/utils/styleUtils';
import { mixedPlaceholder, switchLabel } from '../entryEditor.utils';
import EventTextArea from './EventTextArea';
import EntryEditorTextInput from './EventTextInput';

import style from '../EntryEditor.module.scss';

interface EventEditorTitlesProps {
  /** id of the event being edited, null when editing several events */
  eventId: string | null;
  /** amount of events being edited */
  eventCount: number;
  cue: string;
  flag: boolean | undefined;
  title: string | undefined;
  note: string | undefined;
  colour: string | undefined;
  submit: (patch: Partial<OntimeEvent>) => void;
}

export default memo(EventEditorTitles);
function EventEditorTitles({ eventId, eventCount, cue, flag, title, note, colour, submit }: EventEditorTitlesProps) {
  const isMulti = eventId === null;

  const textSubmitHandler = (field: string, newValue: string) => {
    submit({ [field]: newValue });
  };

  return (
    <div className={style.column}>
      <Editor.Title>Event Data</Editor.Title>
      <div className={style.splitThree}>
        <div>
          <Editor.Label htmlFor='eventId'>{isMulti ? 'Selection (read only)' : 'Event ID (read only)'}</Editor.Label>
          <Input
            id='eventId'
            data-testid='input-textfield'
            value={isMulti ? `${eventCount} events selected` : eventId}
            readOnly
            fluid
          />
        </div>
        {isMulti ? (
          <div>
            <Editor.Label htmlFor='cue'>Cue (not available)</Editor.Label>
            <Input id='cue' value={enDash} readOnly fluid />
          </div>
        ) : (
          <EntryEditorTextInput
            field='cue'
            label='Cue'
            initialValue={cue}
            submitHandler={textSubmitHandler}
            maxLength={10}
          />
        )}
        <div>
          <Editor.Label htmlFor='flag'>Flag</Editor.Label>
          <Editor.Label className={style.switchLabel}>
            <Switch
              id='flag'
              checked={flag ?? false}
              mixed={flag === undefined}
              onCheckedChange={(newValue) => submit({ flag: newValue })}
            />
            {switchLabel(flag)}
          </Editor.Label>
        </div>
      </div>
      <div>
        <Editor.Label>Colour</Editor.Label>
        <SwatchSelect name='colour' value={colour} handleChange={textSubmitHandler} />
      </div>
      <EntryEditorTextInput
        field='title'
        label='Title'
        initialValue={title}
        placeholder={title === undefined ? mixedPlaceholder : undefined}
        submitHandler={textSubmitHandler}
      />
      <EventTextArea
        field='note'
        label='Note'
        initialValue={note}
        placeholder={note === undefined ? mixedPlaceholder : undefined}
        submitHandler={textSubmitHandler}
      />
    </div>
  );
}
