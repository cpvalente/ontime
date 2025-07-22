import { createContext } from 'react';
import { URLPreset } from 'ontime-types';

export const PresetContext = createContext<URLPreset | undefined>(undefined);
