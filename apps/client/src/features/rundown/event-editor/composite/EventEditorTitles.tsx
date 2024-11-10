import { memo } from 'react';
import { Input } from '@chakra-ui/react';
import { sanitiseCue } from 'ontime-utils';

import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import { useFrozen } from '../../../../common/hooks/useSocket';
import { type EditorUpdateFields } from '../EventEditor';

import EventTextArea from './EventTextArea';
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
  const { frozen } = useFrozen();

  const cueSubmitHandler = (_field: string, newValue: string) => {
    handleSubmit('cue', sanitiseCue(newValue));
  };

  return (
    <div className={style.column}>
      <div className={style.splitTwo}>
        <div>
          <label className={style.inputLabel} htmlFor='eventId'>
            Event ID (read only)
          </label>
          <Input
            id='eventId'
            size='sm'
            variant='ontime-filled'
            data-testid='input-textfield'
            value={eventId}
            readOnly
          />
        </div>
        <EventTextInput
          field='cue'
          label='Cue'
          initialValue={cue}
          submitHandler={cueSubmitHandler}
          maxLength={10}
          disabled={frozen}
        />
      </div>
      <div>
        <label className={style.inputLabel}>Colour</label>
        <SwatchSelect name='colour' value={colour} handleChange={handleSubmit} />
      </div>
      <EventTextInput field='title' label='Title' initialValue={title} submitHandler={handleSubmit} disabled={frozen} />
      <EventTextArea field='note' label='Note' initialValue={note} submitHandler={handleSubmit} disabled={frozen} />
    </div>
  );
};

export default memo(EventEditorTitles);
