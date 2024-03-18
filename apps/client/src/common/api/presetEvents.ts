import axios from 'axios';
import { PresetEvent, PresetEvents } from 'ontime-types';

import { apiEntryUrl } from './constants';

const presetEventPath = `${apiEntryUrl}/preset`;

/**
 * Requests list of known preset event
 */
export async function getPresetEvents(): Promise<PresetEvents> {
  const res = await axios.get(presetEventPath);
  return res.data;
}

export async function getPresetEvent(label: string): Promise<PresetEvent> {
  const res = await axios.get(`${presetEventPath}/${label}`);
  return res.data;
}

export async function postPresetEvent(newPreset: PresetEvent): Promise<PresetEvents> {
  const res = await axios.post(presetEventPath, { ...newPreset });
  return res.data;
}

export async function postPresetFromEvent(label: string, eventId: string): Promise<PresetEvents> {
  const res = await axios.post(`${presetEventPath}/${eventId}/${label}`);
  return res.data;
}

/**
 * Edits single preset event
 */
export async function editPresetEvent(label: string, newPreset: PresetEvent): Promise<PresetEvents> {
  const res = await axios.put(`${presetEventPath}/${label}`, { ...newPreset });
  return res.data;
}

/**
 * Deletes single preset event
 */
export async function deletePresetEvent(label: string): Promise<PresetEvents> {
  const res = await axios.delete(`${presetEventPath}/${label}`);
  return res.data;
}
