import { URLPreset } from 'ontime-types';
import { createContext } from 'react';

export const PresetContext = createContext<URLPreset | undefined>(undefined);
