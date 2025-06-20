import { useCallback, useRef } from 'react';
import { Input } from '@chakra-ui/react';

import useReactiveTextInput from '../../../common/components/input/text-input/useReactiveTextInput';
import { useEventAction } from '../../../common/hooks/useEventAction';
import { cx } from '../../../common/utils/styleUtils';

import style from './TitleEditor.module.scss';

interface TitleEditorProps {
  title: string;
  eventId: string;
  placeholder: string;
  className?: string;
}

export default function EditableBlockTitle(props: TitleEditorProps) {
  const { title, eventId, placeholder, className } = props;
  const { updateEvent } = useEventAction();
  const ref = useRef<HTMLInputElement | null>(null);
  const submitCallback = useCallback(
    (text: string) => {
      if (text === title) {
        return;
      }

      const cleanVal = text.trim();
      updateEvent({ id: eventId, title: cleanVal });
    },
    [title, updateEvent, eventId],
  );

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(title, submitCallback, ref, {
    submitOnEnter: true,
  });

  const classes = cx([className, style.eventTitle, !value ? style.noTitle : null]);

  return (
    <Input
      data-testid='block__title'
      variant='ontime-ghosted'
      ref={ref}
      value={value}
      className={classes}
      placeholder={placeholder}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      autoComplete='off'
      fontWeight='600'
      letterSpacing='0.25px'
      paddingLeft='0'
      size='sm'
      fontSize='1rem'
    />
  );
}
