import { memo } from 'react';
import { Input } from '@chakra-ui/react';
import { sanitiseCue } from 'ontime-utils';

import SwatchSelect from '../../../../common/components/input/colour-input/SwatchSelect';
import { type EditorUpdateFields } from '../EventEditor';

import EventTextArea from './EventTextArea';
import EventTextInput from './EventTextInput';

import style from '../EventEditor.module.scss';
import { useTranslation } from '../../../../translation/TranslationProvider';

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

  const { getLocalizedString } = useTranslation();


  return (
    <div className={style.column}>
      <div className={style.splitTwo}>
        <div>
          <label className={style.inputLabel} htmlFor='eventId'>
          {getLocalizedString('editor.eventid')}
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
        <EventTextInput field='cue' label={getLocalizedString('global.cue')} initialValue={cue} submitHandler={cueSubmitHandler} maxLength={10} />
      </div>
      <div>
        <label className={style.inputLabel}>{getLocalizedString('global.colour')}</label>
        <SwatchSelect name='colour' value={colour} handleChange={handleSubmit} />
      </div>
      <EventTextInput field='title' label={getLocalizedString('global.title')} initialValue={title} submitHandler={handleSubmit} />
      <EventTextArea field='note' label={getLocalizedString('global.note')} initialValue={note} submitHandler={handleSubmit} />
    </div>
  );
};

export default memo(EventEditorTitles);
