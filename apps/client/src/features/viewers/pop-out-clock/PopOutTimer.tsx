import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@chakra-ui/react';
import { Playback, ProjectData, TimerPhase, TimerType, ViewSettings } from 'ontime-types';

import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';
import { useWindowTitle } from '../../../common/hooks/useWindowTitle';
import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { OverridableOptions } from '../../../common/models/View.types';
import { useTranslation } from '../../../translation/TranslationProvider';
import { getFormattedTimer, getTimerByType, isStringBoolean } from '../common/viewUtils';

import { POPOUT_TIMER_OPTIONS } from './PopOutTimer.options';

import './PopOutTimer.scss';

interface PopTimerProps {
  general: ProjectData;
  isMirrored: boolean;
  time: ViewExtendedTimer;
  viewSettings: ViewSettings;
}

export default function PopOutClock(props: PopTimerProps) {
  const { general, isMirrored, time, viewSettings } = props;
  const [pipElement, setPipElement] = useState<
    { timer: HTMLDivElement; pipWindow: Window; background: HTMLDivElement } | false
  >(false);
  const [searchParams] = useSearchParams();

  const { getLocalizedString } = useTranslation();

  useWindowTitle('Popout Timer');

  const stageTimer = getTimerByType(false, time);
  const display = getFormattedTimer(stageTimer, time.timerType, getLocalizedString('common.minutes'), {
    removeSeconds: false,
    removeLeadingZero: true,
  });

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
  const stageTimerCharacters = display.replace('/:/g', '').length;
  const timerFontSize = (89 / (stageTimerCharacters - 1)) * (userOptions.size || 1);

  const hideOvertime = searchParams.get('hideovertime');
  userOptions.hideOvertime = isStringBoolean(hideOvertime);

  const hideEndMessage = searchParams.get('hideendmessage');
  userOptions.hideEndMessage = isStringBoolean(hideEndMessage);

  const hideTimerSeconds = searchParams.get('hideTimerSeconds');
  userOptions.hideTimerSeconds = isStringBoolean(hideTimerSeconds);

  const showLeadingZeros = searchParams.get('showLeadingZeros');
  userOptions.removeLeadingZeros = !isStringBoolean(showLeadingZeros);

  const timerIsTimeOfDay = time.timerType === TimerType.Clock;

  const isPlaying = time.playback !== Playback.Pause;

  const shouldShowModifiers = time.timerType === TimerType.CountDown || time.countToEnd;
  const finished = time.phase === TimerPhase.Overtime;
  const showEndMessage = shouldShowModifiers && finished && viewSettings.endMessage && !hideEndMessage;
  const showFinished =
    shouldShowModifiers && finished && !userOptions?.hideOvertime && (shouldShowModifiers || showEndMessage);

  const showProgress = time.playback !== Playback.Stop;
  const showWarning = shouldShowModifiers && time.phase === TimerPhase.Warning;
  const showDanger = shouldShowModifiers && time.phase === TimerPhase.Danger;

  let timerColor = viewSettings.normalColor;
  if (!timerIsTimeOfDay && showProgress && showWarning) timerColor = viewSettings.warningColor;
  if (!timerIsTimeOfDay && showProgress && showDanger) timerColor = viewSettings.dangerColor;

  useEffect(() => {
    if (pipElement) {
      pipElement.timer.innerText = display;
    }
  }, [display, pipElement]);

  useEffect(() => {
    if (pipElement) {
      pipElement.background.classList.toggle('mirror', isMirrored);
      if (userOptions.keyColour) pipElement.background.style.setProperty('background-color', userOptions.keyColour);

      pipElement.timer.classList.toggle('timer--paused', !isPlaying);
      pipElement.timer.classList.toggle('timer--finished', !showFinished);
      if (userOptions.textColour) pipElement.timer.style.setProperty('color', userOptions.textColour);
      if (userOptions.textBackground)
        pipElement.timer.style.setProperty('background-color', userOptions.textBackground);
      if (userOptions.font) pipElement.timer.style.setProperty('font-family', userOptions.font);
      pipElement.timer.style.setProperty('font-size', `${timerFontSize}vw`);
      pipElement.timer.style.setProperty('--phase-color', timerColor);
    }
  }, [
    isMirrored,
    isPlaying,
    pipElement,
    showFinished,
    timerColor,
    timerFontSize,
    userOptions.font,
    userOptions.justifyContent,
    userOptions.keyColour,
    userOptions.textBackground,
    userOptions.textColour,
  ]);

  const closePip = useCallback(() => {
    if (pipElement) {
      pipElement.pipWindow.close();
    }
  }, [pipElement]);

  const openPip = useCallback(() => {
    // @ts-expect-error - pip is experimental https://wicg.github.io/document-picture-in-picture/#documentpictureinpicture
    window.documentPictureInPicture.requestWindow().then((pipWindow: Window) => {
      // Copy style sheets over from the initial document
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch (e) {
          console.log('failed to copy css');
        }
      });

      // create the backgoind element
      const background = document.createElement('div');
      background.classList.add('popout-timer');
      background.classList.toggle('mirror', isMirrored);

      pipWindow.document.body.append(background);

      // create the timer element
      const timer = document.createElement('div');
      timer.classList.add('timer');
      background.append(timer);

      pipWindow.document.title = 'ONTIME'; //TODO: trying to hide or change the title bar

      setPipElement({ timer, pipWindow, background });

      //clear state when the pip is closed
      pipWindow.addEventListener(
        'pagehide',
        () => {
          setPipElement(false);
        },
        { once: true },
      );
    });
  }, [isMirrored]);

  return (
    <div>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <ViewParamsEditor viewOptions={POPOUT_TIMER_OPTIONS} />

      <Button isDisabled={pipElement != false} variant='ontime-filled' onClick={openPip}>
        Open
      </Button>
      <Button isDisabled={pipElement === false} variant='ontime-filled' onClick={closePip}>
        Close
      </Button>
    </div>
  );
}
