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

  const { data, selected, ...rest } = props;

  return (
    <div className={selected ? style.eventRowActive : style.eventRow}>
      <div
        className={armed ? style.armActive : style.arm}
        onClick={() => setArmed(!armed)}
      />
      <div className={style.time}>
        <Editable
          defaultValue={data.timerStart}
          placeholder='--:--'
          style={{ textAlign: 'center' }}
        >
          <EditablePreview />
          <EditableInput />
        </Editable>
      </div>
      <div className={style.time}>
        <Editable
          defaultValue={data.timerEnd}
          placeholder='--:--'
          style={{ textAlign: 'center' }}
        >
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
                defaultValue={data.title}
                placeholder='Add title'
                style={{ display: 'inline' }}
              >
                <EditablePreview />
                <EditableInput style={{ width: '13em' }} />
              </Editable>
            </div>
            <div style={{ display: 'block' }}>
              <span className={style.detailedTitleUnderlined}>Subtitle</span>
              <Editable
                defaultValue={data.subtitle}
                placeholder='Add subtitle'
                style={{ display: 'inline' }}
              >
                <EditablePreview />
                <EditableInput style={{ width: '13em', minWidth: '13em' }} />
              </Editable>
            </div>
            <div style={{ display: 'block' }}>
              <span className={style.detailedTitleUnderlined}>Presenter</span>
              <Editable
                defaultValue={data.presenter}
                placeholder='Add presenter name'
                style={{ display: 'inline' }}
              >
                <EditablePreview style={{}} />
                <EditableInput style={{ width: '13em' }} />
              </Editable>
            </div>
          </div>
        ) : (
          <div className={style.titleContainer}>
            <div>
              <span className={style.detailedTitle}>Title</span>
              <Editable
                defaultValue={data.title}
                placeholder='Add title'
                style={{ display: 'inline' }}
              >
                <EditablePreview />
                <EditableInput style={{ width: '13em' }} />
              </Editable>
            </div>
          </div>
        )}
        <div className={style.more} onClick={() => setMore(!more)}>
          {more ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </div>
      </div>
      <div className={style.actionOverlay}>
        <IconButton
          size='xs'
          icon={<MinusIcon />}
          colorScheme='red'
          onClick={() => props.deleteEvent(data.id)}
        />
        <IconButton
          size='xs'
          icon={<AddIcon />}
          colorScheme='blue'
          onClick={() => props.createEvent(data.order)}
        />
        <IconButton size='xs' icon={<TimeIcon />} colorScheme='yellow' />
        <IconButton size='xs' icon={<NotAllowedIcon />} colorScheme='purple' />
      </div>
    </div>
  );
}
