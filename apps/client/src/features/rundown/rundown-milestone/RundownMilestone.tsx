import { MouseEvent, useCallback, useRef } from 'react';
import { IoReorderTwo, IoTrash } from 'react-icons/io5';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EntryId } from 'ontime-types';

import Input from '../../../common/components/input/input/Input';
import useReactiveTextInput from '../../../common/components/input/text-input/useReactiveTextInput';
import { useContextMenu } from '../../../common/hooks/useContextMenu';
import { useEntryActions } from '../../../common/hooks/useEntryAction';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { useEventSelection } from '../useEventSelection';

import style from './RundownMilestone.module.scss';

interface RundownMilestoneProps {
  colour: string;
  cue: string;
  entryId: EntryId;
  hasCursor: boolean;
  title: string;
}

export default function RundownMilestone({ colour, cue, entryId, hasCursor, title }: RundownMilestoneProps) {
  const handleRef = useRef<null | HTMLSpanElement>(null);
  const { updateEntry, deleteEntry } = useEntryActions();
  const { selectedEvents, setSelectedBlock } = useEventSelection();

  const [onContextMenu] = useContextMenu<HTMLDivElement>([
    {
      type: 'item',
      label: 'Delete',
      icon: IoTrash,
      onClick: () => deleteEntry([entryId]),
    },
  ]);

  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({
    id: entryId,
    data: {
      type: 'milestone',
    },
    animateLayoutChanges: () => false,
  });

  const handleFocusClick = (event: MouseEvent) => {
    event.stopPropagation();

    // event.button === 2 is a right-click
    // disable selection if the user selected events and right clicks
    // so the context menu shows up
    if (selectedEvents.size > 1 && event.button === 2) {
      return;
    }

    // UI indexes are 1 based
    setSelectedBlock({ id: entryId });
  };

  const handleUpdate = (field: 'cue' | 'title', value: string) => {
    updateEntry({ id: entryId, [field]: value });
  };

  const dragStyle = {
    zIndex: isDragging ? 2 : 'inherit',
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const binderColours = colour && getAccessibleColour(colour);

  return (
    <div
      className={cx([style.milestone, hasCursor ? style.hasCursor : null])}
      ref={setNodeRef}
      onClick={handleFocusClick}
      onContextMenu={onContextMenu}
      style={dragStyle}
      data-testid='rundown-milestone'
    >
      <div className={style.binder} style={{ ...binderColours }}>
        <span className={style.drag} ref={handleRef} {...dragAttributes} {...dragListeners}>
          <IoReorderTwo />
        </span>
      </div>
      <MilestoneTextInput field='cue' initialValue={cue} placeholder='Cue' submitHandler={handleUpdate} />
      <MilestoneTextInput field='title' initialValue={title} placeholder='Title' submitHandler={handleUpdate} />
    </div>
  );
}

interface MilestoneTextInputProps {
  field: 'cue' | 'title';
  initialValue: string;
  placeholder?: string;
  submitHandler: (field: 'cue' | 'title', value: string) => void;
}

function MilestoneTextInput({ field, initialValue, placeholder, submitHandler }: MilestoneTextInputProps) {
  const ref = useRef<HTMLInputElement | null>(null);
  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);
  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnEnter: true,
  });

  return (
    <Input
      id={field}
      ref={ref}
      fluid
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  );
}
