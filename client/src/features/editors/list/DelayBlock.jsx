import AddIconBtn from '../../../common/components/buttons/AddIconBtn';
import DeleteIconBtn from '../../../common/components/buttons/DeleteIconBtn';
import { millisToMinutes } from '../../../common/dateConfig';
import TimeInput from '../../../common/input/TimeInput';
import style from './Block.module.css';

export default function DelayBlock(props) {
  const { data, eventsHandler, index } = props;

  const addHandler = () => {
    eventsHandler('add', { type: 'event', order: index + 1 });
  };

  const submitHandler = (value) => {
    // convert to ms and patch
    eventsHandler('patch', { id: data.id, duration: value * 1000 * 60 });
  };

  const deleteHandler = () => {
    eventsHandler('delete', data.id);
  };

  return (
    <div className={style.delay}>
      <TimeInput
        value={millisToMinutes(data.duration)}
        submitHandler={submitHandler}
      />
      <div className={style.actionOverlay}>
        <DeleteIconBtn clickHandler={deleteHandler} />
        <AddIconBtn clickHandler={addHandler} />
      </div>
    </div>
  );
}
