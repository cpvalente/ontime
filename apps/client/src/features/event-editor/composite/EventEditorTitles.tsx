import { memo } from 'react';

import SwatchSelect from '../../../common/components/input/colour-input/SwatchSelect';
import { useEventAction } from '../../../common/hooks/useEventAction';

import CountedTextArea from './CountedTextArea';
import CountedTextInput from './CountedTextInput';

import style from '../EventEditor.module.scss';

interface EventEditorTitlesProps {
  eventId: string;
  title: string;
  presenter: string;
  subtitle: string;
  note: string;
  colour: string;
}

export type TitleActions = 'title' | 'presenter' | 'subtitle' | 'note' | 'colour';

const EventEditorTitles = (props: EventEditorTitlesProps) => {
  const { eventId, title, presenter, subtitle, note, colour } = props;
  const { updateEvent } = useEventAction();

  const handleSubmit = (field: TitleActions, value: string) => {
    updateEvent({ id: eventId, [field]: value });
  };

  return (
    <div className={style.titles}>
      <div className={style.left}>
        <CountedTextInput field='title' label='Title' initialValue={title} submitHandler={handleSubmit} />
        <CountedTextInput field='presenter' label='Presenter' initialValue={presenter} submitHandler={handleSubmit} />
        <CountedTextInput field='subtitle' label='Subtitle' initialValue={subtitle} submitHandler={handleSubmit} />
      </div>
      <div className={style.right}>
        <div className={style.column}>
          <label className={style.inputLabel}>Colour</label>
          <div className={style.inline}>
            <SwatchSelect name='colour' value={colour} handleChange={handleSubmit} />
          </div>
        </div>
        <CountedTextArea field='note' label='Note' initialValue={note} submitHandler={handleSubmit} />
      </div>
    </div>
  );
};

export default memo(EventEditorTitles);
