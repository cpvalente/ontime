import { TimerPhase } from 'ontime-types';
import { useEffect, useRef, useState } from 'react';

import { endSoundSources, type EndSound } from './timer.sound';
import { shouldPlayEndSound } from './timer.utils';

/**
 * Plays a sound when the timer reaches its end
 *
 * Browsers reject playback until the document has been interacted with, and that permission
 * is lost on every page load. Since a timer screen is typically left unattended, we prime the
 * audio element on the first interaction and let the view prompt for one if it never comes.
 * Safari grants the permission per element, so priming has to call play() on this element from
 * inside the event handler, it is not enough to know that an interaction happened.
 */
export function useTimerSound(phase: TimerPhase, sound: EndSound): boolean {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousPhaseRef = useRef<TimerPhase | null>(null);
  const [isArmed, setIsArmed] = useState(false);

  const enabled = sound !== 'none';

  // Create and clean up the audio element; changing sounds requires re-arming it in Safari.
  useEffect(() => {
    setIsArmed(false);

    if (sound === 'none') {
      return;
    }

    const audio = new Audio(endSoundSources[sound]);
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [sound]);

  // Listen for user interaction until muted playback succeeds and arms the selected audio element.
  useEffect(() => {
    if (!enabled || isArmed) {
      return;
    }

    const controller = new AbortController();
    const prime = () => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }

      const wasMuted = audio.muted;
      audio.muted = true;
      audio
        .play()
        .then(() => {
          if (audioRef.current !== audio) {
            return;
          }
          audio.pause();
          audio.currentTime = 0;
          setIsArmed(true);
        })
        .catch(() => {
          // playback is still blocked, a later interaction will try again
        })
        .finally(() => {
          audio.muted = wasMuted;
        });
    };

    document.addEventListener('pointerdown', prime, { capture: true, signal: controller.signal });
    document.addEventListener('keydown', prime, { capture: true, signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [enabled, isArmed]);

  // Track phase transitions and play only when a running timer enters overtime.
  useEffect(() => {
    const previousPhase = previousPhaseRef.current;
    previousPhaseRef.current = phase;

    if (!enabled || !shouldPlayEndSound(previousPhase, phase)) {
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch(() => {
      // the screen has not been interacted with, the view shows a prompt for it
    });
  }, [enabled, phase]);

  return enabled && !isArmed;
}
