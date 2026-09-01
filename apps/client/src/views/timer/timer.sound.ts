import arpeggio from '../../assets/sounds/arpeggio.wav';
import bell from '../../assets/sounds/bell.wav';
import chime from '../../assets/sounds/chime.wav';
import type { SelectOption } from '../../common/components/select/Select';

// synthesised tones bundled with the app, no external source or licence to track
export const endSoundSources = { chime, bell, arpeggio } as const;

export type EndSound = 'none' | keyof typeof endSoundSources;

export const endSoundOptions: SelectOption[] = [
  { value: 'none', label: 'None' },
  { value: 'chime', label: 'Chime' },
  { value: 'bell', label: 'Bell' },
  { value: 'arpeggio', label: 'Arpeggio' },
];

export function isEndSound(value: string | null): value is EndSound {
  return value === 'none' || value === 'chime' || value === 'bell' || value === 'arpeggio';
}
