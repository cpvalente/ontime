import axios from 'axios';
import type {
  Automation,
  AutomationDTO,
  AutomationOutput,
  AutomationSettings,
  Trigger,
  TriggerDTO,
} from 'ontime-types';

import { apiEntryUrl } from './constants';

const automationsPath = `${apiEntryUrl}/automations`;

/**
 * HTTP request to get the automations settings
 */
export async function getAutomationSettings(): Promise<AutomationSettings> {
  const res = await axios.get(automationsPath);
  return res.data;
}

/**
 * HTTP request to edit the automations settings
 */
export async function editAutomationSettings(
  automationSettings: Partial<AutomationSettings>,
): Promise<AutomationSettings> {
  const res = await axios.post(automationsPath, automationSettings);
  return res.data;
}

/**
 * HTTP request to create a new automation trigger
 */
export async function addTrigger(trigger: TriggerDTO): Promise<Trigger> {
  const res = await axios.post(`${automationsPath}/trigger`, trigger);
  return res.data;
}

/**
 * HTTP request to update an automation trigger
 */
export async function editTrigger(id: string, trigger: Trigger): Promise<Trigger> {
  const res = await axios.put(`${automationsPath}/trigger/${id}`, trigger);
  return res.data;
}

/**
 * HTTP request to delete an automation trigger
 */
export function deleteTrigger(id: string): Promise<void> {
  return axios.delete(`${automationsPath}/trigger/${id}`);
}

/**
 * HTTP request to create a new automation
 */
export async function addAutomation(automation: AutomationDTO): Promise<Automation> {
  const res = await axios.post(`${automationsPath}/automation`, automation);
  return res.data;
}

/**
 * HTTP request to update a automation
 */
export async function editAutomation(id: string, automation: Automation): Promise<Automation> {
  const res = await axios.put(`${automationsPath}/automation/${id}`, automation);
  return res.data;
}

/**
 * HTTP request to delete a automation
 */
export function deleteAutomation(id: string): Promise<void> {
  return axios.delete(`${automationsPath}/automation/${id}`);
}

/**
 * HTTP request to test automation output
 * The return is irrelevant as we care for the resolution of the promise
 */
export function testOutput(output: AutomationOutput): Promise<void> {
  return axios.post(`${automationsPath}/test`, output);
}
