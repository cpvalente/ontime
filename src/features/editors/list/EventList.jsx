import { AddIcon, AttachmentIcon, DownloadIcon } from '@chakra-ui/icons';
import { Button, IconButton } from '@chakra-ui/react';
import { useContext } from 'react';
import { EventContext } from '../../../app/context/eventContext';
import { EventListContext } from '../../../app/context/eventListContext';
import EventListItem from './EventListItem';
import { sortByNumber } from './listUtils';
import style from './List.module.css';
import DelayBlock from './DelayBlock';
import BlockBlock from './BlockBlock';

export default function EventList(props) {
  const [events] = useContext(EventListContext);
  const [, setEvent] = useContext(EventContext);

  return (
    <>
      <div className={style.headerButtons}>
        <Button size='sm' rightIcon={<AttachmentIcon />}>
          Upload
        </Button>
        <Button size='sm' rightIcon={<DownloadIcon />}>
          Download
        </Button>
        <IconButton size='sm' icon={<AddIcon />} colorScheme='blue' />
      </div>
      <div className={style.eventContainer}>
        <EventListItem />

        <EventListItem />
        <DelayBlock />

        <EventListItem />
        <BlockBlock />

        <EventListItem />
      </div>
    </>
  );
}
