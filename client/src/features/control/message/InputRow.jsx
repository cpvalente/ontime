import React from 'react';
import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { Tooltip } from '@chakra-ui/tooltip';
import { IconButton } from '@chakra-ui/button';
import { IoSunny } from '@react-icons/all-files/io5/IoSunny';
import PropTypes from 'prop-types';
import style from './MessageControl.module.scss';

export default function InputRow(props) {
  const { label, placeholder, text, visible, actionHandler, changeHandler } = props;

  return (
    <div className={visible && style.inputRowActive}>
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
        <Tooltip label={visible ? 'Make invisible' : 'Make visible'} openDelay={500}>
          <IconButton
            aria-label='Toggle visibility'
            size='sm'
            icon={<IoSunny size='18px' />}
            colorScheme='blue'
            variant={visible ? 'solid' : 'outline'}
            onClick={() => actionHandler('update', { field: 'isPublic', value: !visible })}
          />
        </Tooltip>
      </div>
    </div>
  );
}

InputRow.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  text: PropTypes.string,
  visible: PropTypes.bool,
  actionHandler: PropTypes.func.isRequired,
  changeHandler: PropTypes.func.isRequired,
};
