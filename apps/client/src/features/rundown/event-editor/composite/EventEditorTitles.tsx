import { memo } from 'react';
import { Input } from '@chakra-ui/react';
import { sanitiseCue } from 'ontime-utils';

import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import { type EditorUpdateFields } from '../EventEditor';

import CountedTextArea from './CountedTextArea';
import CountedTextInput from './CountedTextInput';

import style from '../EventEditor.module.scss';

interface EventEditorLeftProps {
  eventId: string;
  cue: string;
  title: string;
  presenter: string;
  subtitle: string;
  note: string;
  colour: string;
  handleSubmit: (field: EditorUpdateFields, value: string) => void;
}

const EventEditorTitles = (props: EventEditorLeftProps) => {
  const { eventId, cue, title, presenter, subtitle, note, colour, handleSubmit } = props;

  const cueSubmitHandler = (_field: string, newValue: string) => {
    handleSubmit('cue', sanitiseCue(newValue));
  };

  return (
    <div className={style.column}>
      <div className={style.splitTwo}>
        <div className={style.column}>
          <div className={style.countedInput}>
            <label className={style.inputLabel} htmlFor='eventId'>
              Event ID (read only)
            </label>
          </div>
          <Input
            id='eventId'
            size='sm'
            variant='ontime-filled'
            data-testid='input-textfield'
            value={eventId}
            readOnly
          />
        </div>
        <CountedTextInput field='cue' label='Cue' initialValue={cue} submitHandler={cueSubmitHandler} maxLength={10} />
      </div>
      <CountedTextInput field='title' label='Title' initialValue={title} submitHandler={handleSubmit} />
      <CountedTextInput field='presenter' label='Presenter' initialValue={presenter} submitHandler={handleSubmit} />
      <CountedTextInput field='subtitle' label='Subtitle' initialValue={subtitle} submitHandler={handleSubmit} />
      <div className={style.column}>
        <label className={style.inputLabel}>Colour</label>
        <div className={style.inline}>
          <SwatchSelect name='colour' value={colour} handleChange={handleSubmit} />
        </div>
      </div>
      <CountedTextArea field='note' label='Note' initialValue={note} submitHandler={handleSubmit} />
    </div>
  );
};

export default memo(EventEditorTitles);
