import style from "./StudioClock.module.scss";
import useFitText from "use-fit-text";
import NavLogo from "../../../common/components/nav/NavLogo";
import {useEffect, useState} from "react";
import {formatDisplay} from "../../../common/utils/dateConfig";
import {formatEventList, trimEventlist} from "../../../common/utils/eventsManager";

export default function StudioClock(props) {
  const { title, time, backstageEvents, selectedId } = props;
  const { fontSize, ref } = useFitText({maxFontSize:500});
  const [hoursNow, minutesNow] = time.clockNoSeconds.split(':');
  const [schedule, setSchedule] = useState([]);

  const onAir = true;
  const hoursIndicators = [...Array(12).keys()];
  const minutesIndicators = [...Array(60).keys()];
  const MAX_TITLES = 8;

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Studio Clock';
  }, []);

  // Prepare event list
  // Todo: useMemo()
  useEffect(() => {
    if (backstageEvents == null) return;

    const events = backstageEvents.filter((e) => e.type === 'event');

    let e = trimEventlist(events, selectedId, MAX_TITLES);
    e = formatEventList(e, selectedId);
    setSchedule(e);

  }, [backstageEvents, selectedId])

  return (
    <div className={style.container}>
      <NavLogo />
      <div className={style.clockContainer}>
        <div className={style.time}>{time.clockNoSeconds}</div>
        <div
          ref={ref}
          className={style.nextTitle}
          style={{fontSize, height:'100px', width:'100%', maxWidth:'680px'}}
        >
          {title.titleNext}
        </div>
          <div className={time.running > 0 ? style.nextCountdown: style.nextCountdown__overtime}>
            {selectedId != null && formatDisplay(time.running)}
          </div>
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
            {schedule.map((s) => (
              <li key={s.id} className={s.isNow ? style.now : s.isNext ? style.next : ''}>
               <div className={s.isNow ? style.decorator__active : s.isNext ? style.decorator__next : style.decorator}/>{`${s.time} ${s.title}`}
              </li>
              ))
            }
          </ul>
        </div>
      </div>
    </div>
  );
}
