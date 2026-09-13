import type { Request, Response } from 'express';
import {
  Automation,
  AutomationComposition,
  AutomationSettings,
  AutomationUsage,
  ErrorResponse,
  Trigger,
} from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { oscServer } from '../../adapters/OscAdapter.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import * as automationDao from './automation.dao.js';
import * as automationService from './automation.service.js';
import { getAutomationUsage } from './automation.utils.js';
import { parseAutomation, parseAutomationComposition, parseOutput } from './automation.validation.js';

export function getAutomationSettings(_req: Request, res: Response<AutomationSettings>) {
  res.status(200).json(automationDao.getAutomationSettings());
}

export function getAutomationUsageCounts(_req: Request, res: Response<AutomationUsage>) {
  const settings = automationDao.getAutomationSettings();
  res
    .status(200)
    .json(getAutomationUsage(settings.automations, settings.triggers, getDataProvider().getProjectRundowns()));
}

export async function postAutomationSettings(req: Request, res: Response<AutomationSettings | ErrorResponse>) {
  try {
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
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function postTrigger(req: Request, res: Response<Trigger | ErrorResponse>) {
  try {
    const automation = await automationDao.addTrigger({
      title: req.body.title,
      trigger: req.body.trigger,
      automationId: req.body.automationId,
    });
    res.status(201).send(automation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function putTrigger(req: Request, res: Response<Trigger | ErrorResponse>) {
  try {
    // body payload is a patch object
    const automation = await automationDao.editTrigger(req.params.id, {
      title: req.body.title ?? undefined,
      trigger: req.body.trigger ?? undefined,
      automationId: req.body.automationId ?? undefined,
    });
    res.status(200).send(automation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function deleteTrigger(req: Request, res: Response<void | ErrorResponse>) {
  try {
    await automationDao.deleteTrigger(req.params.id);
    res.status(204).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function postAutomation(req: Request, res: Response<Automation | ErrorResponse>) {
  try {
    const automation = parseAutomation(req.body);
    const newAutomation = await automationDao.addAutomation(automation);
    res.status(201).send(newAutomation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function postAutomationComposition(req: Request, res: Response<AutomationComposition | ErrorResponse>) {
  try {
    const composition = parseAutomationComposition(req.body);
    const created = await automationDao.createAutomationComposition(composition);
    res.status(201).send(created);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function editAutomation(req: Request, res: Response<Automation | ErrorResponse>) {
  try {
    const automation = parseAutomation(req.body);
    const newAutomation = await automationDao.editAutomation(req.params.id, automation);
    res.status(200).send(newAutomation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function deleteAutomation(req: Request, res: Response<void | ErrorResponse>) {
  try {
    const projectRundowns = getDataProvider().getProjectRundowns();
    await automationDao.deleteAutomation(projectRundowns, req.params.id);
    res.status(204).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function testOutput(req: Request, res: Response<void | ErrorResponse>) {
  try {
    const payload = req.body;
    const parsed = parseOutput(payload);
    automationService.testOutput(parsed);
    res.status(200).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
