import { useCallback, useEffect, useState } from 'react';
import { Editable, EditableInput, EditablePreview } from '@chakra-ui/react';

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
  const [blockTitle, setBlockTitle] = useState<string>(title || '');
  const { updateEvent } = useEventAction();

  useEffect(() => {
    setBlockTitle(title);
  }, [title]);

  const handleTitle = useCallback(
    (text: string) => {
      if (text === title) {
        return;
      }

      const cleanVal = text.trim();
      setBlockTitle(cleanVal);

      updateEvent({ id: eventId, title: cleanVal });
    },
    [title, updateEvent, eventId],
  );

  const classes = cx([className, style.eventTitle, !blockTitle ? style.noTitle : null]);
  return (
    <Editable
      variant='ontime'
      value={blockTitle}
      className={classes}
      placeholder={placeholder}
      onChange={(value) => setBlockTitle(value)}
      onSubmit={(value) => handleTitle(value)}
    >
      <EditablePreview className={style.preview} />
      <EditableInput />
    </Editable>
  );
}
