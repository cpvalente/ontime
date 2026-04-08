import { useEffect, useRef } from 'react';
import { OntimeEvent, SimpleTimerState } from 'ontime-types';

import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { useRuntimeStore } from '../../common/stores/runtime';
import { formatTime } from '../../common/utils/time';

import './CuescreenView.scss';

interface CuescreenViewProps {
  time: ViewExtendedTimer;
  auxTimer: SimpleTimerState;
  eventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
}

/** Formats milliseconds as mm:ss with no hour component (e.g. 90 minutes → 90:00). */
function formatMs(ms: number | null): string {
  if (ms === null) return '0:00';
  const totalSeconds = ms < 0 ? Math.ceil(Math.abs(ms) / 1000) : Math.floor(Math.abs(ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const sign = ms < 0 ? '-' : '';
  return `${sign}${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function CuescreenView({ time, auxTimer, eventNow, eventNext }: CuescreenViewProps) {
  useWindowTitle('Cuescreen');

  const qlab = useRuntimeStore((state) => state.qlab);

  useEffect(() => {
    document.body.setAttribute('data-view', 'cuescreen');
    return () => document.body.removeAttribute('data-view');
  }, []);

  const isAltarCall = eventNow?.title === 'Altar Call';
  const isOvertime = (time.current ?? 0) < 0;
  const timerColor = isOvertime ? 'red' : 'limegreen';

  const mainTimerDisplay = isAltarCall ? '0:00' : formatMs(time.current);
  const auxTimerColor = isOvertime ? 'red' : 'orange';
  const regularAuxColor = (auxTimer.current ?? 0) < 0 ? 'red' : 'orange';

  const clock = formatTime(time.clock, { format12: 'h:mm a', format24: 'H:mm' });

  const eventContainerRef = useRef<HTMLDivElement>(null);
  const nextTitleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function resizeNextTitle() {
      const titleEl = nextTitleRef.current;
      const eventEl = eventContainerRef.current;
      if (!titleEl || !eventEl) return;

      // Reset to max font size (matches label size) and shrink to fit single line
      const maxFontSize = 90;
      const minFontSize = 24;
      let fontSize = maxFontSize;
      titleEl.style.fontSize = `${fontSize}px`;

      while (titleEl.scrollWidth > titleEl.clientWidth && fontSize > minFontSize) {
        fontSize -= 1;
        titleEl.style.fontSize = `${fontSize}px`;
      }
    }

    resizeNextTitle();
    const observer = new ResizeObserver(resizeNextTitle);
    if (eventContainerRef.current) {
      observer.observe(eventContainerRef.current);
    }
    return () => observer.disconnect();
  }, [eventNext?.title]);

  return (
    <div className='cuescreen'>
      <div className='cuescreen__timer-container'>
        <div className='cuescreen__timer-row'>
          <div className='cuescreen__clock'>{clock}</div>
          <div className='cuescreen__main-timer' style={{ color: timerColor }}>
            {mainTimerDisplay}
          </div>
          {isAltarCall ? (
            <div className='cuescreen__aux-timer' style={{ color: auxTimerColor }}>
              {formatMs(time.current)}
            </div>
          ) : (
            <div className='cuescreen__aux-timer' style={{ color: regularAuxColor }}>
              {formatMs(auxTimer.current)}
            </div>
          )}
        </div>
      </div>

      <div className='cuescreen__event-container' ref={eventContainerRef}>
        <div className='cuescreen__title-card'>
          <span className='cuescreen__title-card__label'>
            NEXT:&nbsp;
          </span>
          <span className='cuescreen__title-card__title' style={{ color: timerColor }} ref={nextTitleRef}>
            {eventNext?.title ?? ''}
          </span>
        </div>
      </div>
      {qlab.enabled && (
        <div className='cuescreen__qlab-timer'>
          {formatMs(qlab.remaining)}
        </div>
      )}
    </div>
  );
}
