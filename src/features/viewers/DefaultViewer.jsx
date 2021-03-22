import 'bulma/css/bulma.css';
import { addMinutes, format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Container, Progress } from 'react-bulma-components/dist';
import { sampleData } from '../../app/sampleData';
import Countdown from '../../common/components/countdown/Countdown';
import MyProgressBar from '../../common/components/myProgressBar/MyProgressBar';
import SmallTimer from '../../common/components/smallTimer/SmallTimer';
import './viewers.css';

export default function DefaultViewer() {
  const [data, setData] = useState(sampleData);
  const [timer, setTimer] = useState(sampleData.timerDuration);
  const [elapsed, setElapsed] = useState(0);

  const timeNow = new Date();

  return (
    <Container fluid className='presenter'>
      <div className='presentationTitle'>{data.title}</div>
      <div className='presentationSub'>{data.subtitle}</div>
      <Countdown time={format(timer, 'mm.ss')} />
      {!data.message.active && <MyProgressBar normalisedComplete={0.9} />}
      <div
        className={data.message.active ? 'userMessage' : 'userMessage hidden'}
      >
        {data.message.text}
      </div>
      <div className='extra'>
        <SmallTimer label='Scheduled Start' time={data.timeStart} />
        <SmallTimer label='Current Time' time={format(timeNow, 'HH:mm')} />
        <SmallTimer label='Scheduled End' time={data.timeEnd} />
      </div>
    </Container>
  );
}
