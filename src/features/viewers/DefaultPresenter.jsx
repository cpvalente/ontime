import { differenceInSeconds, format, subMinutes } from 'date-fns';
import addMinutes from 'date-fns/addMinutes';
import { sampleData } from '../../app/sampleData';
import Countdown from '../../common/components/countdown/Countdown';
import MyProgressBar from '../../common/components/myProgressBar/MyProgressBar';
import SmallTimer from '../../common/components/smallTimer/SmallTimer';
import './viewers.css';

export default function DefaultPresenter(props) {
  const data = sampleData;
  const now = new Date();
  const values = props.data ?? {
    title: 'Presentation Title',
    subtitle: 'Presentation Subtitle',
    presenter: 'Presenter Name',
    timerDuration: 10,
    timeStart: now,
    timeEnd: now,
  };

  // NITE: test only
  const clockStarted = addMinutes(now, 6);

  const timer = differenceInSeconds(
    now,
    subMinutes(clockStarted, values.timerDuration)
  );

  const timeStart = format(values.timeStart, 'HH:mm');
  const currentTime = format(now, 'HH:mm');
  const timeEnd = format(values.timeEnd, 'HH:mm');
  const elapsed = timer / (values.timerDuration * 60);

  console.log('timers', timer, timeStart, currentTime, timeEnd, elapsed);

  if (props?.preview) return <div>Preview</div>;

  return (
    <div className='presenter'>
      <div className='presentationTitle'>{values.title}</div>
      <div className='presentationSub'>{values.subtitle}</div>
      <Countdown time={timer} />
      {!data.message.active && <MyProgressBar normalisedComplete={elapsed} />}
      <div
        className={data.message.active ? 'userMessage' : 'userMessage hidden'}
      >
        {data.message.text}
      </div>
      <div className='extra'>
        <SmallTimer label='Scheduled Start' time={timeStart} />
        <SmallTimer label='Current Time' time={currentTime} />
        <SmallTimer label='Scheduled End' time={timeEnd} />
      </div>
    </div>
  );
}
