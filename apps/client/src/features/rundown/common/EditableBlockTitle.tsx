import { useCallback, useRef } from 'react';

import Input from '../../../common/components/input/input/Input';
import useReactiveTextInput from '../../../common/components/input/text-input/useReactiveTextInput';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
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
  const { updateEntry } = useEntryActions();
  const ref = useRef<HTMLInputElement | null>(null);
  const submitCallback = useCallback(
    (text: string) => {
      if (text === title) {
        return;
      }

      const cleanVal = text.trim();
      updateEntry({ id: eventId, title: cleanVal });
    },
    [title, updateEntry, eventId],
  );

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(title, submitCallback, ref, {
    submitOnEnter: true,
  });

  const classes = cx([className, style.eventTitle, !value ? style.noTitle : null]);

  return (
    <Input
      data-testid='block__title'
      variant='ghosted'
      fluid
      ref={ref}
      value={value}
      className={classes}
      placeholder={placeholder}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  );
}
