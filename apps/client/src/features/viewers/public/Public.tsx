import { useEffect, useMemo } from 'react';
import QRCode from 'react-qr-code';
import { AnimatePresence, motion } from 'framer-motion';
import { Message, OntimeEvent, ProjectData, Settings, ViewSettings } from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import Schedule from '../../../common/components/schedule/Schedule';
import { ScheduleProvider } from '../../../common/components/schedule/ScheduleContext';
import ScheduleNav from '../../../common/components/schedule/ScheduleNav';
import TitleCard from '../../../common/components/title-card/TitleCard';
import { getPublicOptions } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { formatTime, getDefaultFormat } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';
import { titleVariants } from '../common/animation';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';

import './Public.scss';

interface BackstageProps {
  isMirrored: boolean;
  publ: Message;
  eventNow: OntimeEvent | null;
  eventNext: OntimeEvent | null;
  time: ViewExtendedTimer;
  events: OntimeEvent[];
  general: ProjectData;
  viewSettings: ViewSettings;
  settings: Settings | undefined;
}

export default function Public(props: BackstageProps) {
  const { isMirrored, publ, eventNow, eventNext, time, events, general, viewSettings, settings } = props;

  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const { getLocalizedString } = useTranslation();

  const filter = 'isPublic';

  const filteredEventNow = useMemo(() => {
    if (!eventNow || !Object.hasOwn(events[0], filter)) {
      return null;
    }
    if (eventNow && eventNow[filter as keyof OntimeEvent] === true) {
      return eventNow;
    }
    const selectedEventIndex = events.findIndex((e) => e.id === eventNow?.id);
    for (let i = selectedEventIndex; i >= 0; i--) {
      if (events[i][filter as keyof OntimeEvent] === true) {
        return events[i];
      }
    }
    return null;
  }, [eventNow, events]);

  const filteredEventNext = useMemo(() => {
    if (!eventNext || !Object.hasOwn(events[0], filter)) {
      return null;
    }
    if (eventNext && eventNext[filter as keyof OntimeEvent] === true) {
      return eventNext;
    }
    const numEvents = events.length;
    const nextEventIndex = events.findIndex((e) => e.id === eventNext?.id);
    for (let i = nextEventIndex; i < numEvents; i++) {
      if (events[i][filter as keyof OntimeEvent] === true) {
        return events[i];
      }
    }
    return null;
  }, [eventNext, events]);

  const filteredEvents = useMemo(() => {
    return filter === undefined ? events : events.filter((e) => e[filter as keyof OntimeEvent] === true);
  }, [events, filter]);

  useEffect(() => {
    document.title = 'ontime - Public Screen';
  }, []);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  const showPublicMessage = publ.text && publ.visible;
  const clock = formatTime(time.clock);
  const qrSize = Math.max(window.innerWidth / 15, 128);

  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const publicOptions = getPublicOptions(defaultFormat);

  return (
    <div className={`public-screen ${isMirrored ? 'mirror' : ''}`} data-testid='public-view'>
      <NavigationMenu />
      <ViewParamsEditor paramFields={publicOptions} />
      <div className='project-header'>
        {general.title}
        <div className='clock-container'>
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <SuperscriptTime time={clock} className='time' />
        </div>
      </div>

      <div className='now-container'>
        <AnimatePresence>
          {filteredEventNow && (
            <motion.div
              className='event now'
              key='now'
              variants={titleVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
            >
              <TitleCard
                label='now'
                title={filteredEventNow.title}
                subtitle={filteredEventNow.subtitle}
                presenter={filteredEventNow.presenter}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {filteredEventNext && (
            <motion.div
              className='event next'
              key='next'
              variants={titleVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
            >
              <TitleCard
                label='next'
                title={filteredEventNext.title}
                subtitle={filteredEventNext.subtitle}
                presenter={filteredEventNext.presenter}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScheduleProvider events={filteredEvents} selectedEventId={filteredEventNow?.id ?? null}>
        <ScheduleNav className='schedule-nav-container' />
        <Schedule className='schedule-container' />
      </ScheduleProvider>

      <div className={showPublicMessage ? 'public-container' : 'public-container public-container--hidden'}>
        <div className='label'>{getLocalizedString('common.public_message')}</div>
        <div className='message'>{publ.text}</div>
      </div>

      <div className='info'>
        {general.publicUrl && <QRCode value={general.publicUrl} size={qrSize} level='L' className='qr' />}
        {general.publicInfo && <div className='info__message'>{general.publicInfo}</div>}
      </div>
    </div>
  );
}
