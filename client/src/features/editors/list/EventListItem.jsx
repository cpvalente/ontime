import DelayBlock from '../DelayBlock/DelayBlock';
import BlockBlock from '../BlockBlock/BlockBlock';
import EventBlock from '../EventBlock/EventBlock';
import { memo, useContext } from 'react';
import { LoggingContext } from '../../../app/context/LoggingContext';
import { LocalEventSettingsContext } from '../../../app/context/LocalEventSettingsContext';

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
  const {
    type,
    index,
    eventIndex,
    data,
    selected,
    next,
    eventsHandler,
    delay,
    previousEnd,
    ...rest
  } = props;
  const { emitError } = useContext(LoggingContext);
  const { starTimeIsLastEnd, defaultPublic } = useContext(LocalEventSettingsContext);

  // Create / delete new events
  const actionHandler = (action, payload) => {
    switch (action) {
      case 'event':
        eventsHandler(
          'add',
          {
            type: 'event',
            order: index + 1,
            isPublic: defaultPublic,
          },
          { startIsLastEnd: starTimeIsLastEnd ? index : undefined }
        );
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
          emitError(`Unknown field: ${field}`);
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
