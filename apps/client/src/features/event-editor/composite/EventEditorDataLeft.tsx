import { memo } from 'react';
import { Input } from '@chakra-ui/react';

import { type EditorUpdateFields } from '../EventEditor';

import CountedTextInput from './CountedTextInput';

import style from '../EventEditor.module.scss';

interface EventEditorLeftProps {
  eventId: string;
  cue: string;
  title: string;
  presenter: string;
  subtitle: string;
  handleSubmit: (field: EditorUpdateFields, value: string) => void;
}

const EventEditorDataLeft = (props: EventEditorLeftProps) => {
  const { eventId, cue, title, presenter, subtitle, handleSubmit } = props;

  return (
    <div className={style.left}>
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
        <CountedTextInput field='cue' label='Cue' initialValue={cue} submitHandler={handleSubmit} maxLength={5} />
      </div>
      <CountedTextInput field='title' label='Title' initialValue={title} submitHandler={handleSubmit} />
      <CountedTextInput field='presenter' label='Presenter' initialValue={presenter} submitHandler={handleSubmit} />
      <CountedTextInput field='subtitle' label='Subtitle' initialValue={subtitle} submitHandler={handleSubmit} />
    </div>
  );
};

export default memo(EventEditorDataLeft);
