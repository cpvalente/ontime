import { memo } from 'react';
import { Input } from '@chakra-ui/react';
import { sanitiseCue } from 'ontime-utils';

import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import * as Editor from '../../../editors/editor-utils/EditorUtils';
import { type EditorUpdateFields } from '../EventEditor';
import RichTextEditor from '../../../../common/components/input/rich-text-editor/RichTextEditor';

import EventTextInput from './EventTextInput';

import style from '../EventEditor.module.scss';

interface EventEditorTitlesProps {
  eventId: string;
  cue: string;
  title: string;
  note: string;
  colour: string;
  handleSubmit: (field: EditorUpdateFields, value: string) => void;
}

const EventEditorTitles = (props: EventEditorTitlesProps) => {
  const { eventId, cue, title, note, colour, handleSubmit } = props;

  const cueSubmitHandler = (_field: string, newValue: string) => {
    handleSubmit('cue', sanitiseCue(newValue));
  };

  return (
    <div className={style.column}>
      <Editor.Title>Event Data</Editor.Title>
      <div className={style.splitTwo}>
        <div>
          <Editor.Label htmlFor='eventId'>Event ID (read only)</Editor.Label>
          <Input
            id='eventId'
            size='sm'
            variant='ontime-filled'
            data-testid='input-textfield'
            value={eventId}
            readOnly
          />
        </div>
        <EventTextInput field='cue' label='Cue' initialValue={cue} submitHandler={cueSubmitHandler} maxLength={10} />
      </div>
      <div>
        <Editor.Label>Colour</Editor.Label>
        <SwatchSelect name='colour' value={colour} handleChange={handleSubmit} />
      </div>
      <EventTextInput field='title' label='Title' initialValue={title} submitHandler={handleSubmit} />
      <div>
        <Editor.Label>Note</Editor.Label>
        <RichTextEditor initialValue={note} onChange={(newNote) => handleSubmit('note', newNote)} />
      </div>
    </div>
  );
};

export default memo(EventEditorTitles);
