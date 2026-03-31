import { useEffect, useRef } from 'react';
import { OntimeEvent, SimpleTimerState } from 'ontime-types';

import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
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
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const sign = ms < 0 ? '-' : '';
  return `${sign}${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function CuescreenView({ time, auxTimer, eventNow, eventNext }: CuescreenViewProps) {
  useWindowTitle('Cuescreen');

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

  // Auto-resize the NEXT title to fit on a single line within the available width
  const nextContainerRef = useRef<HTMLDivElement>(null);
  const nextTitleRef = useRef<HTMLSpanElement>(null);
  const nextLabelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function resizeNextTitle() {
      const titleEl = nextTitleRef.current;
      const containerEl = nextContainerRef.current;
      const labelEl = nextLabelRef.current;
      if (!titleEl || !containerEl) return;

      titleEl.style.fontSize = '';
      const computedStyle = window.getComputedStyle(titleEl);
      let fontSize = parseFloat(computedStyle.fontSize) || 90;
      const minFontSize = 30;
      const labelWidth = labelEl?.offsetWidth ?? 0;
      const availableWidth = containerEl.clientWidth - labelWidth - 40;
      if (availableWidth <= 0) return;

      while (titleEl.scrollWidth > availableWidth && fontSize > minFontSize) {
        fontSize -= 1;
        titleEl.style.fontSize = `${fontSize}px`;
      }
    }

    resizeNextTitle();
    const observer = new ResizeObserver(resizeNextTitle);
    if (nextContainerRef.current) {
      observer.observe(nextContainerRef.current);
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

      <div className='cuescreen__event-container'>
        <div className='cuescreen__title-card' ref={nextContainerRef}>
          <span className='cuescreen__title-card__label' ref={nextLabelRef}>
            NEXT:&nbsp;
          </span>
          <span className='cuescreen__title-card__title' style={{ color: timerColor }} ref={nextTitleRef}>
            {eventNext?.title ?? ''}
          </span>
        </div>
      </div>
    </div>
  );
}
