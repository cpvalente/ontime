import DelayBlock from './DelayBlock';
import BlockBlock from './BlockBlock';
import EventBlock from './EventBlock';
import { showErrorToast } from 'common/helpers/toastManager';
import { memo } from 'react';

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.data.revision === nextProps.data.revision &&
    prevProps.selected === nextProps.selected &&
    prevProps.next === nextProps.next &&
    prevProps.index === nextProps.index &&
    prevProps.delay === nextProps.delay
  );
};

const EventListItem = (props) => {
  const {
    type,
    index,
    eventIndex,
    data,
    selected,
    next,
    eventsHandler,
    delay,
    ...rest
  } = props;

  // Create / delete new events
  const actionHandler = (action, payload) => {
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
      case 'update':
        // Handles and filters update requests
        const { field, value } = payload;
        if (field === 'durationOverride') {
          // duration defines timeEnd
          let end = (data.timeStart += value);
          const newData = { id: data.id, timeEnd: end };

          // request update in parent
          eventsHandler('patch', newData);
        } else if (field in data) {
          // create object with new field
          const newData = { id: data.id, [field]: value };

          // request update in parent
          eventsHandler('patch', newData);
        } else {
          showErrorToast('Field Error: ' + field);
        }
        break;
      default:
        break;
    }
  };

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
        />
      );
    case 'block':
      return (
        <BlockBlock index={index} data={data} actionHandler={actionHandler} />
      );
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
