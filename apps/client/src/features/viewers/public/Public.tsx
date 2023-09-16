import { useEffect } from 'react';
import QRCode from 'react-qr-code';
import { AnimatePresence, motion } from 'framer-motion';
import { Message, OntimeEvent, ProjectData, ViewSettings } from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/apiConstants';
import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import Schedule from '../../../common/components/schedule/Schedule';
import { ScheduleProvider } from '../../../common/components/schedule/ScheduleContext';
import ScheduleNav from '../../../common/components/schedule/ScheduleNav';
import TitleCard from '../../../common/components/title-card/TitleCard';
import { TIME_FORMAT_OPTION } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { TimeManagerType } from '../../../common/models/TimeManager.type';
import { formatTime } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';
import { titleVariants } from '../common/animation';

import './Public.scss';

const formatOptions = {
  showSeconds: true,
  format: 'hh:mm:ss a',
};

interface BackstageProps {
  isMirrored: boolean;
  publ: Message;
  publicEventNow: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;
  time: TimeManagerType;
  events: OntimeEvent[];
  publicSelectedId: string | null;
  general: ProjectData;
  viewSettings: ViewSettings;
}

export default function Public(props: BackstageProps) {
  const { isMirrored, publ, publicEventNow, publicEventNext, time, events, publicSelectedId, general, viewSettings } =
    props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const { getLocalizedString } = useTranslation();

  useEffect(() => {
    document.title = 'ontime - Public Screen';
  }, []);

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  const showPublicMessage = publ.text && publ.visible;
  const clock = formatTime(time.clock, formatOptions);
  const qrSize = Math.max(window.innerWidth / 15, 128);

  return (
    <div className={`public-screen ${isMirrored ? 'mirror' : ''}`} data-testid='public-view'>
      <NavigationMenu />
      <ViewParamsEditor paramFields={[TIME_FORMAT_OPTION]} />
      <div className='project-header'>
        {general.title}
        <div className='clock-container'>
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <div className='time'>{clock}</div>
        </div>
      </div>

      <div className='now-container'>
        <AnimatePresence>
          {publicEventNow && (
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
                title={publicEventNow.title}
                subtitle={publicEventNow.subtitle}
                presenter={publicEventNow.presenter}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {publicEventNext && (
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
                title={publicEventNext.title}
                subtitle={publicEventNext.subtitle}
                presenter={publicEventNext.presenter}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScheduleProvider events={events} selectedEventId={publicSelectedId}>
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
