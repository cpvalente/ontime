import { useEffect, useRef } from 'react';

import { useFlatRundownWithMetadata } from '../hooks-query/useRundown';
import useCustomFields from '../hooks-query/useCustomFields';

/**
 * Parses time string in hh:mm:ss or mm:ss format to seconds
 * @param timeStr - Time string to parse
 * @returns Number of seconds, or null if invalid format
 */
function parseTimeToSeconds(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') {
    return null;
  }

  // Remove whitespace
  const trimmed = timeStr.trim();

  // Match hh:mm:ss or mm:ss format
  const timePattern = /^(\d{1,2}):(\d{2}):(\d{2})$|^(\d{1,2}):(\d{2})$/;
  const match = trimmed.match(timePattern);

  if (!match) {
    return null;
  }

  // hh:mm:ss format
  if (match[1] !== undefined) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // mm:ss format
  if (match[4] !== undefined) {
    const minutes = parseInt(match[4], 10);
    const seconds = parseInt(match[5], 10);
    return minutes * 60 + seconds;
  }

  return null;
}

/**
 * Gets available voices from Web Speech API
 */
function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Finds a voice by URI or name
 */
function findVoice(voiceId: string, language: string): SpeechSynthesisVoice | null {
  if (!voiceId) {
    return null;
  }

  const voices = getAvailableVoices();
  if (voices.length === 0) {
    return null;
  }

  // Try to find by URI first
  let voice = voices.find((v) => v.voiceURI === voiceId);
  if (voice) {
    return voice;
  }

  // Try to find by name
  voice = voices.find((v) => v.name === voiceId);
  if (voice) {
    return voice;
  }

  // Fallback to first voice matching the language
  voice = voices.find((v) => v.lang.startsWith(language.split('-')[0]));
  if (voice) {
    return voice;
  }

  // Last resort: return first available voice
  return voices[0] || null;
}

/**
 * Hook to monitor custom fields and read aloud time values using TTS
 * Only works in cuesheet view
 */
export function useCustomFieldTTS() {
  const { data: rundown } = useFlatRundownWithMetadata();
  const { data: customFields } = useCustomFields();

  const previousValuesRef = useRef<Map<string, string>>(new Map());
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    // Check if Web Speech API is available
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Web Speech API not available');
      return;
    }

    speechSynthesisRef.current = window.speechSynthesis;

    if (!customFields) {
      return;
    }

    // Process each entry in the rundown
    rundown.forEach((entry) => {
      if (!entry.custom) {
        return;
      }

      // Check each custom field
      Object.entries(entry.custom).forEach(([fieldKey, fieldValue]) => {
        if (!fieldValue || typeof fieldValue !== 'string') {
          return;
        }

        // Get TTS settings for this custom field
        const fieldConfig = customFields[fieldKey];
        if (!fieldConfig?.tts?.enabled) {
          return;
        }

        const ttsSettings = fieldConfig.tts;
        if (!ttsSettings) {
          return;
        }

        // Create a unique key for this entry+field combination
        const entryFieldKey = `${entry.id}-${fieldKey}`;
        const previousValue = previousValuesRef.current.get(entryFieldKey);

        // Only process if value has changed
        if (previousValue === fieldValue) {
          return;
        }

        // Update the previous value
        previousValuesRef.current.set(entryFieldKey, fieldValue);

        // Parse time to seconds
        const seconds = parseTimeToSeconds(fieldValue);
        if (seconds === null) {
          return;
        }

        // Check if seconds are below threshold
        if (seconds > ttsSettings.threshold) {
          return;
        }

        // Format the time to read just the number
        const secondsText = `${seconds}`;

        // Cancel any pending speech to prevent queue issues
        // This helps prevent Google voices from skipping numbers
        if (speechSynthesisRef.current.speaking || speechSynthesisRef.current.pending) {
          speechSynthesisRef.current.cancel();
        }

        // Small delay to ensure cancellation is processed before speaking
        // This prevents the "every second number" issue with Google voices
        setTimeout(() => {
          // Check again if we should still speak (value might have changed)
          const currentValue = previousValuesRef.current.get(entryFieldKey);
          if (currentValue !== fieldValue) {
            return; // Value changed, don't speak
          }

          // Speak the time value
          isSpeakingRef.current = true;

          const utterance = new SpeechSynthesisUtterance(secondsText);
          utterance.lang = ttsSettings.language || 'en-US';
          
          // Set speech rate to be faster (1.0 is normal, 1.5-2.0 is faster)
          // Using 1.1 for a slight speed increase
          utterance.rate = 1.1;

          // Set voice if available
          const voice = findVoice(ttsSettings.voice, ttsSettings.language);
          if (voice) {
            utterance.voice = voice;
          }

          utterance.onend = () => {
            isSpeakingRef.current = false;
          };

          utterance.onerror = () => {
            isSpeakingRef.current = false;
          };

          speechSynthesisRef.current.speak(utterance);
        }, 100);
      });
    });
  }, [rundown, customFields]);

  // Cleanup: cancel any ongoing speech when component unmounts
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
        isSpeakingRef.current = false;
      }
    };
  }, []);
}
