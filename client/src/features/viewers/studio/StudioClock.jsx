// https://github.com/cpvalente/ontime/issues/42
// https://www.1001fonts.com/digital-dream-font.html

import style from "./StudioClock.module.scss";

export default function StudioClock() {

  const time = '23:45'
  const nextTitle = 'Race Start';
  const nextCountdown = '-00:25:34';
  const onAir = 'ON AIR';
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
      title: 'Race Finish'
    },
    {
      time: '16:30',
      title: 'Prize Podium'
    },
  ];
  const now = 'Start Grid Walk';
  const next = 'Race Start';
  const hoursIndicators = [...Array(12).keys()]
  const minutesIndicators = [...Array(60).keys()]

  return (
    <div className={style.container}>
      <div className={style.clockContainer}>
        <div className={style.time}>{time}</div>
        <div className={style.nextTitle}>{nextTitle}</div>
        <div className={style.nextCountdown}>{nextCountdown}</div>
        <div className={style.indicators}>
          {hoursIndicators.map(i => (
              <div
                key = {i}
                className={style.hours}
                style={{
                  transform: `rotate(${360/12*i}deg) translateX(250px)`
                }}/>
            )
          )}
          {minutesIndicators.map(i => (
              <div
                key={i}
                className={style.min}
                style={{
                  transform: `rotate(${360/60*i}deg) translateX(280px)`
                }}/>
            )
          )}
        </div>
      </div>
      <div className={style.scheduleContainer}>
        <div className={style.onAir}>{onAir}</div>
        <div className={style.schedule}>
          <ul>
            {schedule.map((m) => (
              <li key={m.title} className={m.title === now ? style.now : m.title === next ? style.next : ''}>
                {`${m.time} - ${m.title}`}
              </li>
              ))
            }
          </ul>
        </div>
      </div>
    </div>
  );
}
