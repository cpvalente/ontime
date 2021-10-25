import QRCode from 'react-qr-code';
import style from './Pip.module.css';
import Paginator from 'common/components/views/Paginator';
import NavLogo from 'common/components/nav/NavLogo';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatDisplay } from 'common/dateConfig';
import { ReactComponent as Emptyimage } from 'assets/images/empty.svg';

export default function Pip(props) {
  const { time, backstageEvents, selectedId, general } = props;
  const [size, setSize] = useState('');
  const ref = useRef(null);
  const [filteredEvents, setFilteredEvents] = useState(null);

  // calculcate pip size
  useLayoutEffect(() => {
    const h = ref.current.clientHeight;
    const w = ref.current.clientWidth;
    setSize(`${w} x ${h}`);
  }, []);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Pip';
  }, []);

  // calculate delays if any
  useEffect(() => {
    if (backstageEvents == null) return;

    let events = [...backstageEvents];

    // Add running delay
    let delay = 0;
    for (const e of events) {
      if (e.type === 'block') delay = 0;
      else if (e.type === 'delay') delay = delay + e.duration;
      else if (e.type === 'event' && delay > 0) {
        e.timeStart += delay;
        e.timeEnd += delay;
      }
    }

    // filter just events
    let filtered = events.filter((e) => e.type === 'event');

    setFilteredEvents(filtered);
  }, [backstageEvents]);

  // Format messages
  const showInfo =
    general.backstageInfo !== '' && general.backstageInfo != null;
  let stageTimer = formatDisplay(Math.abs(time.running), true);
  if (time.running < 0) stageTimer = `-${stageTimer}`;

  return (
    <div className={style.container__gray}>
      <NavLogo />

      <div className={style.eventTitle}>{general.title}</div>

      <div className={style.todayContainer}>
        <div className={style.label}>Today</div>
        <div className={style.entriesContainer}>
          <Paginator
            selectedId={selectedId}
            events={filteredEvents}
            limit={15}
            time={20}
          />
        </div>
      </div>

      <div className={style.pip} ref={ref}>
        <Emptyimage className={style.empty} />
        <span className={style.piptext}>{size}</span>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div className={style.infoContainer}>
            <div className={style.label}>Info</div>
            <div className={style.infoMessages}>
              <div className={style.info}>{general.backstageInfo}</div>
            </div>
            <div className={style.qr}>
              {general.url != null && general.url !== '' && (
                <QRCode
                  value={general.url}
                  size={window.innerWidth / 12}
                  level='L'
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={style.clockContainer}>
        <div className={style.label}>Time Now</div>
        <div className={style.clock}>{time.clock}</div>
      </div>

      <div className={style.countdownContainer}>
        <div className={style.label}>Stage Timer</div>
        <div className={style.clock}>{stageTimer}</div>
      </div>
    </div>
  );
}
