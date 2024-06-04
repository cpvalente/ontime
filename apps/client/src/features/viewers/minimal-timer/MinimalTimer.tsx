import { useSearchParams } from 'react-router-dom';
import { Playback, TimerPhase, TimerType, ViewSettings } from 'ontime-types';

import { overrideStylesURL } from '../../../common/api/constants';
import { MINIMAL_TIMER_OPTIONS } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useRuntimeStylesheet } from '../../../common/hooks/useRuntimeStylesheet';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { OverridableOptions } from '../../../common/models/View.types';
import { useTranslation } from '../../../translation/TranslationProvider';
import { getFormattedTimer, getTimerByType, isStringBoolean } from '../common/viewUtils';

import './MinimalTimer.scss';

interface MinimalTimerProps {
  isMirrored: boolean;
  time: ViewExtendedTimer;
  viewSettings: ViewSettings;
}

export default function MinimalTimer(props: MinimalTimerProps) {
  const { isMirrored, time, viewSettings } = props;
  const { shouldRender } = useRuntimeStylesheet(viewSettings?.overrideStyles && overrideStylesURL);
  const { getLocalizedString } = useTranslation();
  const [searchParams] = useSearchParams();

  useWindowTitle('Minimal Timer');

  // defer rendering until we load stylesheets
  if (!shouldRender) {
    return null;
  }

  // TODO: this should be tied to the params
  // USER OPTIONS
  const userOptions: OverridableOptions = {
    size: 1,
  };

  // key: string
  // Should be a hex string '#00FF00' with key colour
  const key = searchParams.get('key');
  if (key) {
    userOptions.keyColour = `#${key}`;
  }

  // textColour: string
  // Should be a hex string '#ffffff'
  const textColour = searchParams.get('text');
  if (textColour) {
    userOptions.textColour = `#${textColour}`;
  }

  // textBackground: string
  // Should be a hex string '#ffffff'
  const textBackground = searchParams.get('textbg');
  if (textBackground) {
    userOptions.textBackground = `#${textBackground}`;
  }

  // font: string
  // Should be a string with a font name 'arial'
  const font = searchParams.get('font');
  if (font) {
    userOptions.font = font;
  }

  // size: multiplier
  // Should be a number 0.0-n
  const size = searchParams.get('size');
  if (size !== null && typeof size !== 'undefined') {
    if (!Number.isNaN(Number(size))) {
      userOptions.size = Number(size);
    }
  }

  // alignX: flex justification
  // start | center | end
  const alignX = searchParams.get('alignx');
  if (alignX) {
    if (alignX === 'start' || alignX === 'center' || alignX === 'end') {
      userOptions.justifyContent = alignX;
    }
  }

  // alignX: flex alignment
  // start | center | end
  const alignY = searchParams.get('aligny');
  if (alignY) {
    if (alignY === 'start' || alignY === 'center' || alignY === 'end') {
      userOptions.alignItems = alignY;
    }
  }

  // offsetX: position in pixels
  // Should be a number 0 - 1920
  const offsetX = searchParams.get('offsetx');
  if (offsetX) {
    const pixels = Number(offsetX);
    if (!isNaN(pixels)) {
      userOptions.left = `${pixels}px`;
    }
  }

  // offsetX: position in pixels
  // Should be a number 0 - 1920
  const offsetY = searchParams.get('offsety');
  if (offsetY) {
    const pixels = Number(offsetY);
    if (!isNaN(pixels)) {
      userOptions.top = `${pixels}px`;
    }
  }

  const hideOvertime = searchParams.get('hideovertime');
  userOptions.hideOvertime = isStringBoolean(hideOvertime);

  const hideEndMessage = searchParams.get('hideendmessage');
  userOptions.hideEndMessage = isStringBoolean(hideEndMessage);

  const hideTimerSeconds = searchParams.get('hideTimerSeconds');
  userOptions.hideTimerSeconds = isStringBoolean(hideTimerSeconds);

  const timerIsTimeOfDay = time.timerType === TimerType.Clock;

  const isPlaying = time.playback !== Playback.Pause;

  const shouldShowModifiers = time.timerType !== TimerType.Clock && time.timerType !== TimerType.CountUp;
  const finished = time.phase === TimerPhase.Overtime;
  const showEndMessage = finished && viewSettings.endMessage && !hideEndMessage;
  const showFinished = finished && !userOptions?.hideOvertime && (shouldShowModifiers || showEndMessage);

  const showProgress = time.playback !== Playback.Stop;
  const showWarning = shouldShowModifiers && time.phase === TimerPhase.Warning;
  const showDanger = shouldShowModifiers && time.phase === TimerPhase.Danger;

  let timerColor = viewSettings.normalColor;
  if (!timerIsTimeOfDay && showProgress && showWarning) timerColor = viewSettings.warningColor;
  if (!timerIsTimeOfDay && showProgress && showDanger) timerColor = viewSettings.dangerColor;

  const stageTimer = getTimerByType(viewSettings.freezeEnd, time);
  const display = getFormattedTimer(stageTimer, time.timerType, getLocalizedString('common.minutes'), {
    removeSeconds: userOptions.hideTimerSeconds,
    removeLeadingZero: true,
  });

  const stageTimerCharacters = display.replace('/:/g', '').length;

  const timerFontSize = (89 / (stageTimerCharacters - 1)) * (userOptions.size || 1);

  const timerClasses = `timer ${!isPlaying ? 'timer--paused' : ''} ${showFinished ? 'timer--finished' : ''}`;
  const baseClasses = `minimal-timer ${isMirrored ? 'mirror' : ''}`;
  return (
    <div
      className={showFinished ? `${baseClasses} minimal-timer--finished` : baseClasses}
      style={{
        backgroundColor: userOptions.keyColour,
        justifyContent: userOptions.justifyContent,
        alignContent: userOptions.alignItems,
      }}
      data-testid='minimal-timer'
    >
      <ViewParamsEditor paramFields={MINIMAL_TIMER_OPTIONS} />
      {showEndMessage ? (
        <div className='end-message'>{viewSettings.endMessage}</div>
      ) : (
        <div
          className={timerClasses}
          style={{
            fontSize: `${timerFontSize}vw`,
            fontFamily: userOptions.font,
            top: userOptions.top,
            left: userOptions.left,
            backgroundColor: userOptions.textBackground,
            '--phase-color': timerColor,
          }}
        >
          {display}
        </div>
      )}
    </div>
  );
}
