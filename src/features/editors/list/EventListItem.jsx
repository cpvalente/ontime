import {
  AddIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MinusIcon,
  NotAllowedIcon,
  TimeIcon,
} from '@chakra-ui/icons';
import {
  IconButton,
  Editable,
  EditablePreview,
  EditableInput,
} from '@chakra-ui/react';
import { useState } from 'react';
import style from './List.module.css';

export default function EventListItem(props) {
  const [more, setMore] = useState(false);
  const [armed, setArmed] = useState(false);

  return (
    <div className={armed ? style.eventRowActive : style.eventRow}>
      <div
        className={armed ? style.armActive : style.arm}
        onClick={() => setArmed(!armed)}
      />
      <div className={style.time}>
        <Editable defaultValue='11:20' style={{ textAlign: 'center' }}>
          <EditablePreview />
          <EditableInput />
        </Editable>
      </div>
      <div className={style.rowDetailed}>
        {more ? (
          <div className={style.detailedContainer}>
            <div style={{ display: 'block' }}>
              <span className={style.detailedTitleUnderlined}>Title</span>
              <Editable
                defaultValue='Event Title'
                style={{ display: 'inline' }}
              >
                <EditablePreview />
                <EditableInput style={{width:'15em'}} />
              </Editable>
            </div>
            <div style={{ display: 'block' }}>
              <span className={style.detailedTitleUnderlined}>Subtitle</span>
              <Editable
                defaultValue='Event Subtitle'
                style={{ display: 'inline' }}
              >
                <EditablePreview />
                <EditableInput style={{width:'15em'}} />
              </Editable>
            </div>
            <div style={{ display: 'block' }}>
              <span className={style.detailedTitleUnderlined}>Presenter</span>
              <Editable
                defaultValue='Presenter Name'
                style={{ display: 'inline' }}
              >
                <EditablePreview style={{}} />
                <EditableInput style={{width:'15em'}} />
              </Editable>
            </div>
          </div>
        ) : (
          <div className={style.titleContainer}>
            <div>
              <span className={style.detailedTitle}>Title</span>
              <Editable
                defaultValue='Event Title'
                style={{ display: 'inline' }}
              >
                <EditablePreview />
                <EditableInput style={{width:'15em'}} />
              </Editable>
            </div>
          </div>
        )}
        <div className={style.more} onClick={() => setMore(!more)}>
          {more ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </div>
      </div>
      <div className={style.actionOverlay}>
        <IconButton size='xs' icon={<MinusIcon />} colorScheme='red' />
        <IconButton size='xs' icon={<AddIcon />} colorScheme='blue' />
        <IconButton size='xs' icon={<TimeIcon />} colorScheme='yellow' />
        <IconButton size='xs' icon={<NotAllowedIcon />} colorScheme='purple' />
      </div>
    </div>
  );
}
