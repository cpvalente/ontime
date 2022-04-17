import React from 'react';
import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import VisibleIconBtn from '../../../common/components/buttons/VisibleIconBtn';
import style from './MessageControl.module.scss';

const inputProps = {
  size: 'sm',
};

export default function InputRow(props) {
  const { label, placeholder, text, visible, actionHandler, changeHandler } = props;

  return (
    <>
      <span className={style.label}>{label}</span>
      <div className={style.inputItems}>
        <Editable
          onChange={(event) => changeHandler(event)}
          value={text}
          placeholder={placeholder}
          className={style.inline}
          color={text === '' ? '#666' : 'inherit'}
        >
          <EditablePreview className={style.padleft} />
          <EditableInput className={style.padleft} />
        </Editable>
        <VisibleIconBtn
          active={visible || undefined}
          actionHandler={actionHandler}
          {...inputProps}
        />
      </div>
    </>
  );
}
