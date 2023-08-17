import { memo, PropsWithChildren } from 'react';

import SwatchSelect from '../../../common/components/input/colour-input/SwatchSelect';
import { EditorUpdateFields } from '../EventEditor';

import CountedTextArea from './CountedTextArea';

import style from '../EventEditor.module.scss';

interface EventEditorRightProps {
  note: string;
  colour: string;
  handleSubmit: (field: EditorUpdateFields, value: string) => void;
}

const EventEditorDataRight = (props: PropsWithChildren<EventEditorRightProps>) => {
  const { children, note, colour, handleSubmit } = props;

  return (
    <div className={style.right}>
      <div className={style.column}>
        <label className={style.inputLabel}>Colour</label>
        <div className={style.inline}>
          <SwatchSelect name='colour' value={colour} handleChange={handleSubmit} />
        </div>
      </div>
      <CountedTextArea field='note' label='Note' initialValue={note} submitHandler={handleSubmit} />
      <div className={style.eventActions}>{children}</div>
    </div>
  );
};

export default memo(EventEditorDataRight);
