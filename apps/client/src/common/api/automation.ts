import axios from 'axios';
import type {
  Automation,
  AutomationBlueprint,
  AutomationBlueprintDTO,
  AutomationDTO,
  AutomationOutput,
  AutomationSettings,
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
 * HTTP request to create a new automation
 */
export async function addAutomation(automation: AutomationDTO): Promise<Automation> {
  const res = await axios.post(`${automationsPath}/automation`, automation);
  return res.data;
}

/**
 * HTTP request to update an automation
 */
export async function editAutomation(id: string, automation: Automation): Promise<Automation> {
  const res = await axios.put(`${automationsPath}/automation/${id}`, automation);
  return res.data;
}

/**
 * HTTP request to delete an automation
 */
export function deleteAutomation(id: string): Promise<void> {
  return axios.delete(`${automationsPath}/automation/${id}`);
}

/**
 * HTTP request to create a new blueprint
 */
export async function addBlueprint(blueprint: AutomationBlueprintDTO): Promise<AutomationBlueprint> {
  const res = await axios.post(`${automationsPath}/blueprint`, blueprint);
  return res.data;
}

/**
 * HTTP request to update a blueprint
 */
export async function editBlueprint(id: string, blueprint: AutomationBlueprint): Promise<AutomationBlueprint> {
  const res = await axios.put(`${automationsPath}/blueprint/${id}`, blueprint);
  return res.data;
}

/**
 * HTTP request to delete a blueprint
 */
export function deleteBlueprint(id: string): Promise<void> {
  return axios.delete(`${automationsPath}/blueprint/${id}`);
}

/**
 * HTTP request to test automation output
 * The return is irrelevant as we care for the resolution of the promise
 */
export async function testOutput(output: AutomationOutput): Promise<void> {
  return axios.post(automationsPath, output);
}
