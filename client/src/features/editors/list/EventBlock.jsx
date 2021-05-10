import Icon from '@chakra-ui/icon';
import { FiChevronDown, FiChevronUp, FiMoreVertical } from 'react-icons/fi';
import { memo, useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import EventTimes from '../../../common/components/eventTimes/EventTimes';
import EventTimesVertical from '../../../common/components/eventTimes/EventTimesVertical';
import EditableText from '../../../common/input/EditableText';
import ActionButtons from './ActionButtons';
import VisibleIconBtn from '../../../common/components/buttons/VisibleIconBtn';
import DeleteIconBtn from '../../../common/components/buttons/DeleteIconBtn';
import { millisToMinutes } from '../../../common/dateConfig';
import style from './EventBlock.module.css';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.data.revision === nextProps.data.revision &&
    prevProps.selected === nextProps.selected &&
    prevProps.next === nextProps.next &&
    prevProps.index === nextProps.index &&
    prevProps.delay === nextProps.delay
  );
};

const ExpandedBlock = (props) => {
  const { provided, data, next, delay, delayValue, actionHandler } = props;

  return (
    <>
      <span className={style.drag} {...provided.dragHandleProps}>
        <FiMoreVertical />
      </span>

      <div className={style.indicators}>
        <span className={next ? style.next : style.nextDisabled}>Next</span>
        {delayValue != null && (
          <span className={style.delayValue}>+ {delayValue}</span>
        )}
      </div>
      <div className={style.timeExpanded}>
        <EventTimesVertical
          actionHandler={actionHandler}
          timeStart={data.timeStart}
          timeEnd={data.timeEnd}
          delay={delay}
          className={style.time}
        />
      </div>

      <div className={style.titleContainer}>
        <EditableText
          label='Title'
          defaultValue={data.title}
          placeholder='Add Title'
          submitHandler={(v) =>
            actionHandler('update', { field: 'title', value: v })
          }
        />
        <EditableText
          label='Presenter'
          defaultValue={data.presenter}
          placeholder='Add Presenter name'
          submitHandler={(v) =>
            actionHandler('update', { field: 'presenter', value: v })
          }
        />
        <EditableText
          label='Subtitle'
          defaultValue={data.subtitle}
          placeholder='Add Subtitle'
          submitHandler={(v) =>
            actionHandler('update', { field: 'subtitle', value: v })
          }
        />
        <EditableText
          label='Note'
          defaultValue={data.note}
          placeholder='Add Note'
          submitHandler={(v) =>
            actionHandler('update', { field: 'note', value: v })
          }
        />
      </div>
      <Icon
        className={style.more}
        as={FiChevronUp}
        marginTop='0.2em'
        gridArea='more'
        onClick={() => props.setExpanded(false)}
      />
      <div className={style.actionOverlay}>
        <VisibleIconBtn actionHandler={actionHandler} active={data.isPublic} />
        <ActionButtons
          showAdd
          showDelay
          showBlock
          actionHandler={actionHandler}
        />
        <DeleteIconBtn actionHandler={actionHandler} />
      </div>
    </>
  );
};

const CollapsedBlock = (props) => {
  const { provided, data, next, delay, delayValue, actionHandler } = props;

  return (
    <>
      <span className={style.drag} {...provided.dragHandleProps}>
        <FiMoreVertical />
      </span>

      <div className={style.indicators}>
        <span className={next ? style.next : style.nextDisabled}>Next</span>
        {delayValue != null && (
          <span className={style.delayValue}>+ {delayValue}</span>
        )}
      </div>
      <EventTimes
        actionHandler={actionHandler}
        timeStart={data.timeStart}
        timeEnd={data.timeEnd}
        delay={delay}
        className={style.time}
      />
      <div className={style.titleContainer}>
        <EditableText
          label='Title'
          defaultValue={data.title}
          placeholder='Add Title'
          submitHandler={(v) =>
            actionHandler('update', { field: 'title', value: v })
          }
        />
      </div>
      <Icon
        className={style.more}
        as={FiChevronDown}
        marginTop='0.2em'
        gridArea='more'
        onClick={() => props.setExpanded(true)}
      />
      <div className={style.actionOverlay}>
        <VisibleIconBtn actionHandler={actionHandler} active={data.isPublic} />
        <ActionButtons
          showAdd
          showDelay
          showBlock
          actionHandler={actionHandler}
        />
      </div>
    </>
  );
};

const EventBlock = (props) => {
  const { data, selected, delay, index, actionHandler } = props;

  const [expanded, setExpanded] = useState(true);

  // TODO: should this go inside useEffect()
  // Would I then need to add this to state?
  const isSelected = selected ? style.active : '';
  const isExpanded = expanded ? style.expanded : style.collapsed;
  const classSelect = `${style.event} ${isExpanded} ${isSelected}`;

  // Calculate delay in min
  const delayValue = delay > 0 ? millisToMinutes(delay) : null;

  return (
    <Draggable key={data.id} draggableId={data.id} index={index}>
      {(provided) => (
        <div
          className={classSelect}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          {expanded ? (
            <ExpandedBlock
              provided={provided}
              data={data}
              next={props.next}
              delay={delay}
              delayValue={delayValue}
              actionHandler={actionHandler}
              setExpanded={setExpanded}
            />
          ) : (
            <CollapsedBlock
              provided={provided}
              data={data}
              next={props.next}
              delay={delay}
              delayValue={delayValue}
              actionHandler={actionHandler}
              setExpanded={setExpanded}
            />
          )}
        </div>
      )}
    </Draggable>
  );
};

export default memo(EventBlock, areEqual);
