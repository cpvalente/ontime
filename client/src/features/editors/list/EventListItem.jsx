import DelayBlock from './DelayBlock';
import BlockBlock from './BlockBlock';
import EventBlock from './EventBlock';

export default function EventListItem(props) {
  const {
    type,
    index,
    data,
    selected,
    next,
    eventsHandler,
    delay,
    ...rest
  } = props;

  switch (type) {
    case 'event':
      return (
        <EventBlock
          index={index}
          data={data}
          selected={selected}
          next={next === index}
          eventsHandler={eventsHandler}
          delay={delay}
        />
      );
    case 'block':
      return (
        <BlockBlock index={index} data={data} eventsHandler={eventsHandler} />
      );
    case 'delay':
      return (
        <DelayBlock index={index} data={data} eventsHandler={eventsHandler} />
      );
    default:
      break;
  }
}
