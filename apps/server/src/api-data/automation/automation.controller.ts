import type { Request, Response } from 'express';
import { Automation, AutomationSettings, Trigger } from 'ontime-types';

import { oscServer } from '../../adapters/OscAdapter.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import * as automationDao from './automation.dao.js';
import * as automationService from './automation.service.js';
import { parseAutomation, parseOutput } from './automation.validation.js';

export function getAutomationSettings(_req: Request, res: Response<AutomationSettings>) {
  res.status(200).json(automationDao.getAutomationSettings());
}

export async function postAutomationSettings(req: Request, res: Response<AutomationSettings>) {
  // body payload is a patch object that must contain root properties
  const automationSettings = await automationDao.editAutomationSettings({
    enabledAutomations: req.body.enabledAutomations,
    enabledOscIn: req.body.enabledOscIn,
    oscPortIn: req.body.oscPortIn,
    triggers: req.body.triggers ?? undefined,
    automations: req.body.automations ?? undefined,
  });
  if (automationSettings.enabledOscIn) {
    oscServer.init(automationSettings.oscPortIn);
  } else {
    oscServer.shutdown();
  }
  res.status(200).send(automationSettings);
}

export async function postTrigger(req: Request, res: Response<Trigger>) {
  const automation = await automationDao.addTrigger({
    title: req.body.title,
    trigger: req.body.trigger,
    automationId: req.body.automationId,
  });
  res.status(201).send(automation);
}

export async function putTrigger(req: Request, res: Response<Trigger>) {
  // body payload is a patch object
  const automation = await automationDao.editTrigger(req.params.id, {
    title: req.body.title ?? undefined,
    trigger: req.body.trigger ?? undefined,
    automationId: req.body.automationId ?? undefined,
  });
  res.status(200).send(automation);
}

export async function deleteTrigger(req: Request, res: Response<void>) {
  await automationDao.deleteTrigger(req.params.id);
  res.status(204).send();
}

export async function postAutomation(req: Request, res: Response<Automation>) {
  const automation = parseAutomation(req.body);
  const newAutomation = await automationDao.addAutomation(automation);
  res.status(201).send(newAutomation);
}

export async function editAutomation(req: Request, res: Response<Automation>) {
  const automation = parseAutomation(req.body);
  const newAutomation = await automationDao.editAutomation(req.params.id, automation);
  res.status(200).send(newAutomation);
}

export async function deleteAutomation(req: Request, res: Response<void>) {
  const projectRundowns = getDataProvider().getProjectRundowns();
  await automationDao.deleteAutomation(projectRundowns, req.params.id);
  res.status(204).send();
}

export function testOutput(req: Request, res: Response<void>) {
  const payload = req.body;
  const parsed = parseOutput(payload);
  automationService.testOutput(parsed);
  res.status(200).send();
}
