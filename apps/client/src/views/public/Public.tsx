import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CustomFields, OntimeEvent, ProjectData, Settings } from 'ontime-types';

import TitleCard from '../../common/components/title-card/TitleCard';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';
import { getPropertyValue } from '../../features/viewers/common/viewUtils';
import { useTranslation } from '../../translation/TranslationProvider';
import PublicSchedule from '../common/schedule/PublicSchedule';
import { titleVariants } from '../timer/timer.animations';

import { getPublicOptions } from './public.options';

import './Public.scss';

export const MotionTitleCard = motion(TitleCard);

interface BackstageProps {
  customFields: CustomFields;
  general: ProjectData;
  isMirrored: boolean;
  publicEventNow: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;
  time: ViewExtendedTimer;
  publicSelectedId: string | null;
  settings: Settings | undefined;
}

export default function Public(props: BackstageProps) {
  const { customFields, general, isMirrored, publicEventNow, publicEventNext, time, publicSelectedId, settings } =
    props;

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

      <PublicSchedule selectedId={publicSelectedId} />

      <div className='info'>
        {general.publicUrl && <QRCode value={general.publicUrl} size={qrSize} level='L' className='qr' />}
        {general.publicInfo && <div className='info__message'>{general.publicInfo}</div>}
      </div>
    </div>
  );
}
