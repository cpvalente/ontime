import React, { memo, useCallback, useContext } from 'react';
import { useAtomValue } from 'jotai';
import PropTypes from 'prop-types';

import {
  defaultPublicAtom,
  startTimeIsLastEndAtom,
} from '../../../common/atoms/LocalEventSettings';
import { LoggingContext } from '../../../common/context/LoggingContext';
import BlockBlock from '../BlockBlock/BlockBlock';
import DelayBlock from '../DelayBlock/DelayBlock';
import EventBlock from '../EventBlock/EventBlock';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.data.revision === nextProps.data.revision &&
    prevProps.selected === nextProps.selected &&
    prevProps.next === nextProps.next &&
    prevProps.index === nextProps.index &&
    prevProps.delay === nextProps.delay &&
    prevProps.previousEnd === nextProps.previousEnd
  );
};

const EventListItem = (props) => {
  const { type, index, eventIndex, data, selected, next, eventsHandler, delay, previousEnd } =
    props;
  const { emitError } = useContext(LoggingContext);
  const startTimeIsLastEnd = useAtomValue(startTimeIsLastEndAtom);
  const defaultPublic = useAtomValue(defaultPublicAtom);

  /**
   * @description calculates duration from given options
   * @param {number} start
   * @param {number} end
   * @returns {number}
   */
  const calculateDuration = useCallback(
    (start, end) => (start > end ? end + 86400000 - start : end - start),
    []
  );

  // Create / delete new events
  const actionHandler = useCallback(
    (action, payload) => {
      switch (action) {
        case 'event':
          eventsHandler(
            'add',
            {
              type: 'event',
              after: data.id,
              isPublic: defaultPublic,
            },
            { startIsLastEnd: startTimeIsLastEnd ? data.id : undefined }
          );
          break;
        case 'delay':
          eventsHandler('add', { type: 'delay', after: data.id });
          break;
        case 'block':
          eventsHandler('add', { type: 'block', after: data.id });
          break;
        case 'delete':
          eventsHandler('delete', data.id);
          break;
        case 'update':
          // Handles and filters update requests
          const { field, value } = payload;
          const newData = { id: data.id };

          if (field === 'durationOverride') {
            // duration defines timeEnd
            newData.timeEnd = data.timeStart += value;

            // request update in parent
            eventsHandler('patch', newData);
          } else if (field === 'timeStart') {
            newData.duration = calculateDuration(value, data.timeEnd);
            newData.timeStart = value;
            // request update in parent
            eventsHandler('patch', newData);
          } else if (field === 'timeEnd') {
            newData.duration = calculateDuration(data.timeStart, value);
            newData.timeEnd = value;
            // request update in parent
            eventsHandler('patch', newData);
          } else if (field in data) {
            // create object with new field
            newData[field] = value;

            // request update in parent
            eventsHandler('patch', newData);
          } else {
            emitError(`Unknown field: ${field}`);
          }
          break;
        default:
          break;
      }
    },
    [calculateDuration, data, defaultPublic, emitError, eventsHandler, startTimeIsLastEnd]
  );

  switch (type) {
    case 'event':
      return (
        <EventBlock
          index={index}
          eventIndex={eventIndex}
          data={data}
          selected={selected}
          next={next}
          actionHandler={actionHandler}
          delay={delay}
          previousEnd={previousEnd}
        />
      );
    case 'block':
      return <BlockBlock index={index} data={data} actionHandler={actionHandler} />;
    case 'delay':
      return (
        <DelayBlock
          index={index}
          data={data}
          eventsHandler={eventsHandler}
          actionHandler={actionHandler}
        />
      );
    default:
      break;
  }
};

export default memo(EventListItem, areEqual);

EventListItem.propTypes = {
  type: PropTypes.oneOf(['event', 'delay', 'block']),
  index: PropTypes.number,
  eventIndex: PropTypes.number,
  data: PropTypes.object,
  selected: PropTypes.bool,
  next: PropTypes.bool,
  eventsHandler: PropTypes.func,
  delay: PropTypes.number,
  previousEnd: PropTypes.number,
};
