// https://github.com/cpvalente/ontime/issues/42
// https://www.1001fonts.com/digital-dream-font.html

import style from "./StudioClock.module.scss";
import useFitText from "use-fit-text";
import NavLogo from "../../../common/components/nav/NavLogo";
import {useEffect} from "react";

export default function StudioClock(props) {
  const {title, time} = props;
  const { fontSize, ref } = useFitText({maxFontSize:500});
  const clockNow = time.clockNoSeconds;
  const hoursNow = clockNow.split(':')[0] || 0;
  const minutesNow = clockNow.split(':')[1] || 0;
  const nextTitle = title.titleNext;
  const nextCountdown = '-00:25:34';
  const onAir = true;
  const schedule = [
    {
      time: '22:40',
      title: 'Pre Show'
    },
    {
      time: '23:00',
      title: 'Studio Talk'
    },
    {
      time: '23:10',
      title: 'Garage Walk'
    },
    {
      time: '23:25',
      title: 'Studio Walk'
    },
    {
      time: '23:35',
      title: 'Start Grid Walk'
    },    {
      time: '00:10',
      title: 'Race Start'
    },
    {
      time: '16:10',
      title: 'what is th emost reasonably ling title we can have? maybe something'
    },
    {
      time: '16:30',
      title: 'Prize Podium'
    },
  ];
  const now = 'Start Grid Walk';
  const next = 'Race Start';
  const hoursIndicators = [...Array(12).keys()];
  const minutesIndicators = [...Array(60).keys()];

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Studio Clock';
  }, []);


  return (
    <div className={style.container}>
      <NavLogo />
      <div className={style.clockContainer}>
        <div className={style.time}>{clockNow}</div>
        <div
          ref={ref}
          className={style.nextTitle}
          style={{fontSize, height:'100px', width:'100%', maxWidth:'680px'}}
        >
          {nextTitle}
        </div>
        <div className={style.nextCountdown}>{nextCountdown}</div>
        <div className={style.indicators}>
          {hoursIndicators.map(i => (
              <div
                key = {i}
                className={i <= hoursNow ? style.hours__active : style.hours}
                style={{
                  transform: `rotate(${360/12*i-90}deg) translateX(380px)`
                }}/>
            )
          )}
          {minutesIndicators.map(i => (
              <div
                key={i}
                className={i <= minutesNow ? style.min__active : style.min}
                style={{
                  transform: `rotate(${360/60*i-90}deg) translateX(415px)`
                }}/>
            )
          )}
        </div>
      </div>
      <div className={style.scheduleContainer}>
        <div className={onAir ? style.onAir : style.onAir__idle}>ON AIR</div>
        <div className={style.schedule}>
          <ul>
            {schedule.map((m) => (
              <li key={m.title} className={m.title === now ? style.now : m.title === next ? style.next : ''}>
               <div className={m.title === now ? style.decorator__active : m.title === next ? style.decorator__next : style.decorator}/>{`${m.time} - ${m.title}`}
              </li>
              ))
            }
          </ul>
        </div>
      </div>
    </div>
  );
}
