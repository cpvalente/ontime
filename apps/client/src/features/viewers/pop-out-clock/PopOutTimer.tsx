import { useCallback, useEffect, useState } from 'react';
import { Button } from '@chakra-ui/react';

import { ViewExtendedTimer } from '../../../common/models/TimeManager.type';
import { useTranslation } from '../../../translation/TranslationProvider';
import { getFormattedTimer, getTimerByType } from '../common/viewUtils';

import './PopOutTimer.scss';

interface PopTimerProps {
  time: ViewExtendedTimer;
}

export default function PopOutClock(props: PopTimerProps) {
  const { time } = props;
  const [pipElement, setPipElement] = useState<{ timer: HTMLDivElement; pipWindow: Window } | false>(false);

  const { getLocalizedString } = useTranslation();

  const stageTimer = getTimerByType(false, time);
  const display = getFormattedTimer(stageTimer, time.timerType, getLocalizedString('common.minutes'), {
    removeSeconds: false,
    removeLeadingZero: true,
  });

  useEffect(() => {
    if (pipElement) {
      pipElement.timer.innerText = display;
    }
  }, [display, pipElement]);

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
      background.classList.add('minimal-timer');
      pipWindow.document.body.append(background);

      // create the timer element
      const timer = document.createElement('div');
      timer.classList.add('timer');
      background.append(timer);

      pipWindow.document.title = 'ONTIME'; //TODO: trying to hide or change the title bar

      setPipElement({ timer, pipWindow });

      //clear state when the pip is closed
      pipWindow.addEventListener(
        'pagehide',
        () => {
          setPipElement(false);
        },
        { once: true },
      );
    });
  }, []);

  return (
    <div>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <Button isDisabled={pipElement != false} variant='ontime-filled' onClick={openPip}>
        Open
      </Button>
      <Button isDisabled={pipElement === false} variant='ontime-filled' onClick={closePip}>
        Close
      </Button>
    </div>
  );
}
