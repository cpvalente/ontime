import React, { memo } from 'react';
import { VStack } from '@chakra-ui/react';
import { FiMoreVertical } from '@react-icons/all-files/fi/FiMoreVertical';
import { IoRemove } from '@react-icons/all-files/io5/IoRemove';
import PropTypes from 'prop-types';

import ActionButtons from '../../../common/components/buttons/ActionButtons';
import PublicIconBtn from '../../../common/components/buttons/PublicIconBtn';
import TooltipLoadingActionBtn from '../../../common/components/buttons/TooltipLoadingActionBtn';
import EventTimesVertical from '../../../common/components/eventTimes/EventTimesVertical';
import EditableText from '../../../common/input/EditableText';

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


function ExpandedBlock(props) {
  const { provided, data, eventIndex, next, delay, delayValue, previousEnd, actionHandler } = props;

  const oscid = data?.id || '...';

  return (
    <>
      <span className={style.drag} {...provided.dragHandleProps}>
        <FiMoreVertical />
      </span>

      <div className={style.indicators}>
        <span className={next ? style.next : style.nextDisabled}>Next</span>
        {delayValue != null && <span className={style.delayValue}>{delayValue}</span>}
      </div>
      <div className={style.timeExpanded}>
        <EventTimesVertical
          actionHandler={actionHandler}
          timeStart={data.timeStart}
          timeEnd={data.timeEnd}
          duration={data.duration}
          delay={delay}
          previousEnd={previousEnd}
          className={style.time}
        />
      </div>

      <div className={style.titleContainer}>
        <EditableText
          label='Title'
          defaultValue={data.title}
          placeholder='Add Title'
          submitHandler={(v) => actionHandler('update', { field: 'title', value: v })}
        />
        <EditableText
          label='Presenter'
          defaultValue={data.presenter}
          placeholder='Add Presenter name'
          submitHandler={(v) => actionHandler('update', { field: 'presenter', value: v })}
        />
        <EditableText
          label='Subtitle'
          defaultValue={data.subtitle}
          placeholder='Add Subtitle'
          submitHandler={(v) => actionHandler('update', { field: 'subtitle', value: v })}
        />
        <EditableText
          label='Note'
          defaultValue={data.note}
          placeholder='Add Note'
          style={{ color: '#d69e2e' }}
          maxchar={160}
          submitHandler={(v) => actionHandler('update', { field: 'note', value: v })}
        />
        <span className={style.oscLabel}>
          {`/ontime/goto ${eventIndex + 1}  << OSC >> /ontime/gotoid ${oscid}`}
        </span>
      </div>
      <VStack spacing='0.5em' className={style.actionOverlay}>
        <PublicIconBtn actionHandler={actionHandler} active={data.isPublic} />
        <ActionButtons showAdd showDelay showBlock actionHandler={actionHandler} />
        <TooltipLoadingActionBtn
          clickHandler={() => actionHandler('delete')}
          icon={<IoRemove />}
          colorScheme='red'
          tooltip='Delete'
          _hover={{ bg: 'red.400' }}
        />
      </VStack>
    </>
  );
}

ExpandedBlock.propTypes = {
  provided: PropTypes.any.isRequired,
  data: PropTypes.object.isRequired,
  eventIndex: PropTypes.number.isRequired,
  next: PropTypes.bool.isRequired,
  delay: PropTypes.number,
  delayValue: PropTypes.string,
  previousEnd: PropTypes.number,
  actionHandler: PropTypes.func.isRequired,
};

export default memo(ExpandedBlock, areEqual);
