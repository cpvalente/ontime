import { memo } from 'react';
import { Input } from '@chakra-ui/react';
import { sanitiseCue } from 'ontime-utils';

import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import * as Editor from '../../../editors/editor-utils/EditorUtils';
import { type EditorUpdateFields } from '../EventEditor';

import EventTextArea from './EventTextArea';
import EventTextInput from './EventTextInput';

import style from '../EventEditor.module.scss';
import EventColorPicker from './EventColorPicker';

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
      <Editor.Title>Event data</Editor.Title>
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
        <div className={style.colorSettings}>
          <SwatchSelect name='colour' value={colour} handleChange={handleSubmit} />
          <EventColorPicker name='colour' value={colour} handleChange={handleSubmit} />
        </div>
      </div>
      <EventTextInput field='title' label='Title' initialValue={title} submitHandler={handleSubmit} />
      <EventTextArea field='note' label='Note' initialValue={note} submitHandler={handleSubmit} />
    </div>
  );
};

export default memo(EventEditorTitles);
