import React, { memo } from 'react';
import { HStack } from '@chakra-ui/react';
import { FiMoreVertical } from '@react-icons/all-files/fi/FiMoreVertical';
import ActionButtons from '../../../common/components/buttons/ActionButtons';
import EventTimes from '../../../common/components/eventTimes/EventTimes';
import EditableText from '../../../common/input/EditableText';
import PublicIconBtn from '../../../common/components/buttons/PublicIconBtn';
import PropTypes from 'prop-types';
import style from './EventBlock.module.scss';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.provided === nextProps.provided &&
    prevProps.data.revision === nextProps.data.revision &&
    prevProps.next === nextProps.next &&
    prevProps.delay === nextProps.delay &&
    prevProps.delayValue === nextProps.delayValue &&
    prevProps.previousEnd === nextProps.previousEnd
  );
};

function CollapsedBlock(props) {
  const { provided, data, next, delay, delayValue, previousEnd, actionHandler } = props;

  return (
    <>
      <span className={style.drag} {...provided.dragHandleProps}>
        <FiMoreVertical />
      </span>

      <div className={style.indicators}>
        <span className={next ? style.next : style.nextDisabled}>Next</span>
        {delayValue != null && <span className={style.delayValue}>{delayValue}</span>}
      </div>
      <EventTimes
        actionHandler={actionHandler}
        timeStart={data.timeStart}
        timeEnd={data.timeEnd}
        delay={delay}
        previousEnd={previousEnd}
        className={style.time}
      />
      <div className={style.titleContainer}>
        <EditableText
          label='Title'
          defaultValue={data.title}
          placeholder='Add Title'
          submitHandler={(v) => actionHandler('update', { field: 'title', value: v })}
        />
      </div>
      <HStack spacing='0.5em' className={style.actionOverlay}>
        <PublicIconBtn actionHandler={actionHandler} active={data.isPublic} />
        <ActionButtons showAdd showDelay showBlock actionHandler={actionHandler} />
      </HStack>
    </>
  );
}

CollapsedBlock.propTypes = {
  provided: PropTypes.any.isRequired,
  data: PropTypes.object.isRequired,
  next: PropTypes.bool.isRequired,
  delay: PropTypes.any,
  delayValue: PropTypes.string,
  previousEnd: PropTypes.number.isRequired,
  actionHandler: PropTypes.func.isRequired,
};

export default memo(CollapsedBlock, areEqual);
