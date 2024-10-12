import { memo } from 'react';
import { Input } from '@chakra-ui/react';
import { sanitiseCue } from 'ontime-utils';

import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import { multipleValuesPlaceholder } from '../../../../common/utils/multiValueText';
import { type EditorUpdateFields } from '../EventEditor';

import EventTextArea from './EventTextArea';
import EventTextInput from './EventTextInput';

import style from '../EventEditor.module.scss';

interface EventEditorTitlesCoreProps {
  eventId: string;
  cue: string;
  title: string;
  note: string;
  colour: string;
}

interface EventEditorTitlesProps extends EventEditorTitlesCoreProps {
  submitHandler: (field: EditorUpdateFields, value: string) => void;
  isMultiple?: false;
}

interface EventEditorTitlesMultiProps extends Partial<EventEditorTitlesCoreProps> {
  submitHandler: (field: EditorUpdateFields, value: string) => void;
  isMultiple: true;
}

const EventEditorTitles = (props: EventEditorTitlesProps | EventEditorTitlesMultiProps) => {
  const { eventId, cue, title, note, colour, submitHandler, isMultiple } = props;

  const cueSubmitHandler = (_field: string, newValue: string) => {
    submitHandler('cue', sanitiseCue(newValue));
  };

  const getInitialAndPlaceholder = (value: string | undefined): [string, string | undefined] => {
    return isMultiple && value === undefined ? ['', multipleValuesPlaceholder] : [value ?? '', undefined];
  };

  const [cueInitial, cuePlaceholder] = getInitialAndPlaceholder(cue);
  const [titleInitial, titlePlaceholder] = getInitialAndPlaceholder(title);
  const [noteInitial, notePlaceholder] = getInitialAndPlaceholder(note);
  const colourInitial = isMultiple && colour === undefined ? 'multi' : colour ?? '';

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
          initialValue={cueInitial}
          placeholder={cuePlaceholder}
          submitHandler={cueSubmitHandler}
          maxLength={10}
        />
      </div>
      <div>
        <label className={style.inputLabel}>Colour</label>
        <SwatchSelect name='colour' value={colourInitial} handleChange={submitHandler} />
      </div>
      <EventTextInput
        field='title'
        label='Title'
        initialValue={titleInitial}
        placeholder={titlePlaceholder}
        submitHandler={submitHandler}
      />
      <EventTextArea
        field='note'
        label='Note'
        initialValue={noteInitial}
        placeholder={notePlaceholder}
        submitHandler={submitHandler}
      />
    </div>
  );
};

export default memo(EventEditorTitles);
