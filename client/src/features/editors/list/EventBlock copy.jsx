import { FiChevronDown, FiChevronUp, FiMoreVertical } from 'react-icons/fi';
import { memo, useCallback, useEffect, useState } from 'react';
import { showErrorToast } from '../../../common/helpers/toastManager';
import { Draggable } from 'react-beautiful-dnd';
import EventTimes from '../../../common/components/eventTimes/EventTimes';
// import common from './Block.module.css';
import style from './EventBlock.module.css';
import EditableText from '../../../common/input/EditableText';
import DelayValue from '../../../common/input/DelayValue';
import ActionButtons from './ActionButtons';
import VisibleIconBtn from '../../../common/components/buttons/VisibleIconBtn';
import DeleteIconBtn from '../../../common/components/buttons/DeleteIconBtn';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.data.revision === nextProps.data.revision &&
    prevProps.selected === nextProps.selected &&
    prevProps.next === nextProps.next &&
    prevProps.index === nextProps.index &&
    prevProps.delay === nextProps.delay
  );
};

const EventBlock = (props) => {
  const { data, selected, next, delay, index, eventsHandler } = props;

  const [more, setMore] = useState(true);
  const [visible, setVisible] = useState(data.isPublic || false);

  // Set visibility indicator
  useEffect(() => {
    setVisible(data.isPublic);
  }, [data.isPublic]);

  // Create / delete new events
  const actionHandler = (action) => {
    switch (action) {
      case 'event':
        eventsHandler('add', { type: 'event', order: index + 1 });
        break;
      case 'delay':
        eventsHandler('add', { type: 'delay', order: index + 1 });
        break;
      case 'block':
        eventsHandler('add', { type: 'block', order: index + 1 });
        break;
      case 'delete':
        eventsHandler('delete', data.id);
        break;
      default:
        break;
    }
  };

  // Update data in fields
  const updateValues = (field, value) => {
    // validate field
    if (field in data) {
      // create object with new field
      const newData = { id: data.id, [field]: value };

      // request update in parent
      eventsHandler('patch', newData);
    } else {
      showErrorToast('Field Error: ' + field);
    }
  };

  const handleTitleSubmit = (v) => {
    updateValues('title', v);
  };

  const handleSubtitleSubmit = (v) => {
    updateValues('subtitle', v);
  };

  const handlePresenterSubmit = (v) => {
    updateValues('presenter', v);
  };

  const handleNoteSubmit = (v) => {
    updateValues('note', v);
  };

  const handleVisibleToggle = useCallback(() => {
    const viz = !data.isPublic || !visible;
    updateValues('isPublic', viz);
  }, [data.isPublic, visible, updateValues]);

  // TODO: inside useEffect()
  const isSelected = selected ? style.active : '';
  const isExpanded = more ? style.expanded : style.collapsed;
  const classSelect = ` ${style.event} ${isExpanded} ${isSelected}`;

  return (
    <Draggable key={data.id} draggableId={data.id} index={index}>
      {(provided) => (
        <div
          className={classSelect}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <span className={style.drag} {...provided.dragHandleProps}>
            <FiMoreVertical />
          </span>
          <div className={style.indicators}>
            <div className={next ? style.next : style.nextDisabled}>Next</div>
            <DelayValue delay={delay} />
          </div>
          <EventTimes
            updateValues={updateValues}
            timeStart={data.timeStart}
            timeEnd={data.timeEnd}
            delay={delay}
            className={style.time}
          />
          {more && <div className={style.start}>Start Time</div>}
          {more && <div className={style.end}>End Time</div>}
          {more && <div className={style.duration}>Duration</div>}

          <div className={style.rowDetailed}>
            {more ? (
              <div className={style.titleContainer}>
                <EditableText
                  label='Title'
                  defaultValue={data.title}
                  placeholder='Add Title'
                  submitHandler={handleTitleSubmit}
                  underlined
                />
                <EditableText
                  label='Presenter'
                  defaultValue={data.presenter}
                  placeholder='Add Presenter name'
                  submitHandler={handlePresenterSubmit}
                  underlined
                />
                <EditableText
                  label='Subtitle'
                  defaultValue={data.subtitle}
                  placeholder='Add Subtitle'
                  submitHandler={handleSubtitleSubmit}
                  underlined
                />
                <EditableText
                  label='note'
                  defaultValue={data.note}
                  placeholder='Add note'
                  submitHandler={handleNoteSubmit}
                  underlined
                />
              </div>
            ) : (
              <div className={style.titleContainer}>
                <EditableText
                  label='Title'
                  defaultValue={data.title}
                  placeholder='Add Title'
                  submitHandler={handleTitleSubmit}
                  isTight
                />
              </div>
            )}
            <div className={style.more} onClick={() => setMore(!more)}>
              {more ? <FiChevronUp /> : <FiChevronDown />}
            </div>
          </div>
          <div className={style.actionOverlay}>
            <VisibleIconBtn
              clickhandler={handleVisibleToggle}
              active={visible}
            />
            <DeleteIconBtn actionHandler={actionHandler} />
            <ActionButtons
              showAdd
              showDelay
              showBlock
              actionHandler={actionHandler}
            />
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default memo(EventBlock, areEqual);
// export default EventBlock;
