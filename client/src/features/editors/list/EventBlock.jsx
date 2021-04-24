import { FiChevronDown, FiChevronUp, FiMoreVertical } from 'react-icons/fi';
import { useState } from 'react';
import EventTimes from '../../../common/components/eventTimes/EventTimes';
import { showErrorToast } from '../../../common/helpers/toastManager';
import style from './Block.module.css';
import EditableText from '../../../common/input/EditableText';
import DelayValue from '../../../common/input/DelayValue';
import ActionButtons from './ActionButtons';
import VisibleIconBtn from '../../../common/components/buttons/VisibleIconBtn';
import DeleteIconBtn from '../../../common/components/buttons/DeleteIconBtn';

export default function EventBlock(props) {
  const { data, selected, delay, index, eventsHandler } = props;
  const [visible, setVisible] = useState(false);

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
    eventsHandler('add', { type: 'event', order: index + 1 });
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

  // TODO: implement functionality to select next
  let isNext = false;

  return (
    <div className={selected ? style.eventRowActive : style.eventRow}>
      <span className={style.drag}>
        <FiMoreVertical />
      </span>
      <div className={style.indicators}>
        <div className={isNext ? style.next : style.nextDisabled}>Next</div>
        <DelayValue delay={delay} />
      </div>
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
              submitHandler={handleTitleSubmit}
              underlined
            />
            <EditableText
              label='Subtitle'
              defaultValue={data.subtitle}
              placeholder='Add Subtitle'
              submitHandler={handleSubtitleSubmit}
              underlined
            />
            <EditableText
              label='Presenter'
              defaultValue={data.presenter}
              placeholder='Add Presenter name'
              submitHandler={handlePresenterSubmit}
              underlined
            />
          </div>
        ) : (
          <div className={style.titleContainer}>
            <EditableText
              label='Title'
              defaultValue={data.title}
              placeholder='Add Title'
              submitHandler={handleTitleSubmit}
              isTight
            />
          </div>
        )}
        <div className={style.more} onClick={() => setMore(!more)}>
          {more ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </div>
      <div className={style.actionOverlay}>
        <VisibleIconBtn
          clickHandler={() => setVisible(!visible)}
          active={visible}
        />
        <DeleteIconBtn clickHandler={deleteHandler} />
        <ActionButtons
          showAdd
          addHandler={addHandler}
          showDelay
          delayHandler={delayHandler}
          showBlock
          blockHandler={blockHandler}
        />
      </div>
    </div>
  );
}
