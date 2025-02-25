import QRCode from 'react-qr-code';
import { useViewportSize } from '@mantine/hooks';
import { CustomFields, OntimeEvent, ProjectData, Settings } from 'ontime-types';

import Empty from '../../common/components/state/Empty';
import TitleCard from '../../common/components/title-card/TitleCard';
import ViewLogo from '../../common/components/view-logo/ViewLogo';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../common/models/TimeManager.type';
import { cx } from '../../common/utils/styleUtils';
import { formatTime, getDefaultFormat } from '../../common/utils/time';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';
import { useTranslation } from '../../translation/TranslationProvider';
import { getIsPendingStart } from '../backstage/backstage.utils';
import ScheduleExport from '../common/schedule/ScheduleExport';

import { getPublicOptions, usePublicOptions } from './public.options';
import { getCardData, getFirstStartTime } from './public.utils';

import './Public.scss';

interface BackstageProps {
  customFields: CustomFields;
  events: OntimeEvent[];
  general: ProjectData;
  isMirrored: boolean;
  publicEventNow: OntimeEvent | null;
  publicEventNext: OntimeEvent | null;
  time: ViewExtendedTimer;
  publicSelectedId: string | null;
  settings: Settings | undefined;
}

export default function Public(props: BackstageProps) {
  const {
    customFields,
    events,
    general,
    isMirrored,
    publicEventNow,
    publicEventNext,
    time,
    publicSelectedId,
    settings,
  } = props;

  const { getLocalizedString } = useTranslation();
  const { secondarySource } = usePublicOptions();
  const { height: screenHeight } = useViewportSize();

  useWindowTitle('Public Schedule');

  // gather card data
  const hasEvents = events.length > 0;
  const { showNow, nowMain, nowSecondary, showNext, nextMain, nextSecondary } = getCardData(
    publicEventNow,
    publicEventNext,
    'title',
    secondarySource,
    time.playback,
  );

  // gather timer data
  const clock = formatTime(time.clock);
  const isPendingStart = getIsPendingStart(time.playback, time.phase);
  const scheduledStart = hasEvents && showNow ? '' : getFirstStartTime(events[0]);

  // gather presentation styles
  const qrSize = Math.max(window.innerWidth / 15, 72);
  const showSchedule = hasEvents && screenHeight > 700; // in vertical screens we may not have space

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const publicOptions = getPublicOptions(defaultFormat, customFields);

  return (
    <div className={`public-screen ${isMirrored ? 'mirror' : ''}`} data-testid='public-view'>
      <ViewParamsEditor viewOptions={publicOptions} />
      <div className='project-header'>
        {general?.projectLogo ? <ViewLogo name={general.projectLogo} className='logo' /> : <div className='logo' />}
        <div className='title'>{general.title}</div>
        <div className='clock-container'>
          <div className='label'>{getLocalizedString('common.time_now')}</div>
          <SuperscriptTime time={clock} className='time' />
        </div>
      </div>

      {!hasEvents && <Empty text={getLocalizedString('countdown.waiting')} className='empty-container' />}

      <div className='card-container'>
        {showNow && hasEvents && (
          <TitleCard className='event now' label='now' title={nowMain} secondary={nowSecondary} />
        )}
        {!showNow && scheduledStart && (
          <div className='event'>
            <div className='title-card__placeholder'>{getLocalizedString('countdown.waiting')}</div>
            <div className='timer-group'>
              <div className='time-entry'>
                <div className={cx(['time-entry__label', isPendingStart && 'time-entry--pending'])}>
                  {getLocalizedString('common.scheduled_start')}
                </div>
                <SuperscriptTime time={formatTime(scheduledStart)} className='time-entry__value' />
              </div>
            </div>
          </div>
        )}
        {showNext && hasEvents && (
          <TitleCard className='event next' label='next' title={nextMain} secondary={nextSecondary} />
        )}
      </div>

      {showSchedule && <ScheduleExport selectedId={publicSelectedId} />}

      <div className={cx(['info', !showSchedule && 'info--stretch'])}>
        {general.publicUrl && <QRCode value={general.publicUrl} size={qrSize} level='L' className='qr' />}
        {general.publicInfo && <div className='info__message'>{general.publicInfo}</div>}
      </div>
    </div>
  );
}
