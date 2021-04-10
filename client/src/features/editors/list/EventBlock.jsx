import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useState } from 'react';
import AddIconBtn from '../../../common/components/buttons/AddIconBtn';
import BlockIconBtn from '../../../common/components/buttons/BlockIconBtn';
import DelayIconBtn from '../../../common/components/buttons/DelayIconBtn';
import DeleteIconBtn from '../../../common/components/buttons/DeleteIconBtn';
import EventTimes from '../../../common/components/eventTimes/EventTimes';
import { showErrorToast } from '../../../common/helpers/toastManager';
import style from './List.module.css';
import EditableText from '../../../common/input/EditableText';

export default function EventBlock(props) {
  const { data, selected, delay, index, eventsHandler } = props;

  const [more, setMore] = useState(false);

  const updateValues = (field, value) => {
    // validate field
    if (field in data) {
      // create object with new field
      const newData = { id: data.id, [field]: value };

      // request update in parent
      eventsHandler('patch', newData);
    } else {
      showErrorToast('Field Error: ' + field);
    }
  };

  const addHandler = () => {
    eventsHandler('add', { type: 'block', order: index + 1 });
  };
  const delayHandler = () => {
    eventsHandler('add', { type: 'delay', order: index + 1 });
  };
  const blockHandler = () => {
    eventsHandler('add', { type: 'block', order: index + 1 });
  };
  const deleteHandler = () => {
    eventsHandler('delete', data.id);
  };

  const handleTitleSubmit = (v) => {
    updateValues('title', v);
  };

  const handleSubtitleSubmit = (v) => {
    updateValues('subtitle', v);
  };

  const handlePresenterSubmit = (v) => {
    updateValues('presenter', v);
  };

  return (
    <div className={selected ? style.eventRowActive : style.eventRow}>
      <EventTimes
        updateValues={updateValues}
        timeStart={data.timeStart}
        timeEnd={data.timeEnd}
        delay={delay}
      />
      <div className={style.rowDetailed}>
        {more ? (
          <div className={style.detailedContainer}>
            <EditableText
              label='Title'
              defaultValue={data.title}
              placeholder='Add Title'
              underlined
              submitHandler={handleTitleSubmit}
            />
            <EditableText
              label='Subtitle'
              defaultValue={data.subtitle}
              placeholder='Add Subtitle'
              underlined
              submitHandler={handleSubtitleSubmit}
            />
            <EditableText
              label='Presenter'
              defaultValue={data.subtitle}
              placeholder='Add Presenter name'
              underlined
              submitHandler={handlePresenterSubmit}
            />
          </div>
        ) : (
          <div className={style.titleContainer}>
            <EditableText
              label='Title'
              defaultValue={data.title}
              placeholder='Add Title'
              submitHandler={handleTitleSubmit}
            />
          </div>
        )}
        <div className={style.more} onClick={() => setMore(!more)}>
          {more ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </div>
      <div className={style.actionOverlay}>
        <DeleteIconBtn clickHandler={deleteHandler} />
        <AddIconBtn clickHandler={addHandler} />
        <DelayIconBtn clickHandler={delayHandler} />
        <BlockIconBtn clickHandler={blockHandler} />
      </div>
    </div>
  );
}
