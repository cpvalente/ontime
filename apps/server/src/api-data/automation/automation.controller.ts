import { getErrorMessage } from 'ontime-utils';
import { AutomationSettings, ErrorResponse, RefetchKey } from 'ontime-types';

import type { Request, Response } from 'express';

import { oscServer } from '../../adapters/OscAdapter.js';

import { getCurrentRundown, getRundownMetadata } from '../rundown/rundown.dao.js';

import * as automationDao from './automation.dao.js';
import * as automationService from './automation.service.js';
import { parseOutput } from './automation.validation.js';
import { sendRefetch } from '../../adapters/WebsocketAdapter.js';

export function getAutomationSettings(_req: Request, res: Response<AutomationSettings>) {
  res.status(200).json(automationDao.getAutomationSettings());
}

export async function postAutomationSettings(req: Request, res: Response<void | ErrorResponse>) {
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
    res.status(200).send();
    sendRefetch(RefetchKey.Automation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function postTrigger(req: Request, res: Response<void | ErrorResponse>) {
  try {
    await automationDao.addTrigger({
      title: req.body.title,
      trigger: req.body.trigger,
      automationId: req.body.automationId,
    });
    res.status(201).send();
    sendRefetch(RefetchKey.Automation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function putTrigger(req: Request, res: Response<void | ErrorResponse>) {
  try {
    // body payload is a patch object
    await automationDao.editTrigger(req.params.id, {
      title: req.body.title ?? undefined,
      trigger: req.body.trigger ?? undefined,
      automationId: req.body.automationId ?? undefined,
    });
    res.status(200).send();
    sendRefetch(RefetchKey.Automation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function deleteTrigger(req: Request, res: Response<void | ErrorResponse>) {
  try {
    await automationDao.deleteTrigger(req.params.id);
    res.status(204).send();
    sendRefetch(RefetchKey.Automation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function postAutomation(req: Request, res: Response<void | ErrorResponse>) {
  try {
    await automationDao.addAutomation({
      title: req.body.title,
      filterRule: req.body.filterRule,
      filters: req.body.filters,
      outputs: req.body.outputs,
    });
    res.status(201).send();
    sendRefetch(RefetchKey.Automation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function editAutomation(req: Request, res: Response<void | ErrorResponse>) {
  try {
    await automationDao.editAutomation(req.params.id, {
      title: req.body.title,
      filterRule: req.body.filterRule,
      filters: req.body.filters,
      outputs: req.body.outputs,
    });
    res.status(200).send();
    sendRefetch(RefetchKey.Automation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function deleteAutomation(req: Request, res: Response<void | ErrorResponse>) {
  try {
    const rundown = getCurrentRundown();
    const { timedEventOrder } = getRundownMetadata();

    await automationDao.deleteAutomation(rundown, timedEventOrder, req.params.id);
    res.status(204).send();
    sendRefetch(RefetchKey.Automation);
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
