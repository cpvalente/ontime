import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CustomFields, OntimeEvent, ProjectData, Settings } from 'ontime-types';

import Schedule from '../../../common/components/schedule/Schedule';
import { ScheduleProvider } from '../../../common/components/schedule/ScheduleContext';
import ScheduleNav from '../../../common/components/schedule/ScheduleNav';
import TitleCard from '../../../common/components/title-card/TitleCard';
import ViewLogo from '../../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { formatTime, getDefaultFormat } from '../../../common/utils/time';
import { useTranslation } from '../../../translation/TranslationProvider';
import { titleVariants } from '../common/animation';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import { getPropertyValue } from '../common/viewUtils';

import { getPublicOptions } from './public.options';

import './Public.scss';

export const MotionTitleCard = motion.create(TitleCard);

interface BackstageProps {
  customFields: CustomFields;
  general: ProjectData;
  isMirrored: boolean;
  publicEventNow: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;
  time: ViewExtendedTimer;
  events: OntimeEvent[];
  publicSelectedId: string | null;
  settings: Settings | undefined;
}

export default function Public(props: BackstageProps) {
  const {
    customFields,
    general,
    isMirrored,
    publicEventNow,
    publicEventNext,
    time,
    events,
    publicSelectedId,
    settings,
  } = props;

  const { getLocalizedString } = useTranslation();
  const [searchParams] = useSearchParams();

  useWindowTitle('Public Schedule');

  const clock = formatTime(time.clock);
  const qrSize = Math.max(window.innerWidth / 15, 128);

  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const publicOptions = getPublicOptions(defaultFormat, customFields);

  const secondarySource = searchParams.get('secondary-src');
  const secondaryTextNext = getPropertyValue(publicEventNext, secondarySource);
  const secondaryTextNow = getPropertyValue(publicEventNow, secondarySource);

  return (
    <div className={`public-screen ${isMirrored ? 'mirror' : ''}`} data-testid='public-view'>
      <ViewParamsEditor viewOptions={publicOptions} />
      <div className='project-header'>
        {general?.projectLogo && <ViewLogo name={general.projectLogo} className='logo' />}
        {general.title}
        <div className='clock-container'>
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <SuperscriptTime time={clock} className='time' />
        </div>
      </div>

      <div className='now-container'>
        <AnimatePresence>
          {publicEventNow && (
            <MotionTitleCard
              className='event now'
              key='now'
              variants={titleVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              label='now'
              title={publicEventNow.title}
              secondary={secondaryTextNow}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {publicEventNext && (
            <MotionTitleCard
              className='event next'
              key='next'
              variants={titleVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              label='next'
              title={publicEventNext.title}
              secondary={secondaryTextNext}
            />
          )}
        </AnimatePresence>
      </div>

      <ScheduleProvider events={events} selectedEventId={publicSelectedId}>
        <ScheduleNav className='schedule-nav-container' />
        <Schedule className='schedule-container' />
      </ScheduleProvider>

      <div className='info'>
        {general.publicUrl && <QRCode value={general.publicUrl} size={qrSize} level='L' className='qr' />}
        {general.publicInfo && <div className='info__message'>{general.publicInfo}</div>}
      </div>
    </div>
  );
}
