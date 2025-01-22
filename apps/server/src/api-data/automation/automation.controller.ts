import { getErrorMessage } from 'ontime-utils';
import { Automation, AutomationOutput, AutomationSettings, ErrorResponse, Trigger } from 'ontime-types';

import type { Request, Response } from 'express';

import * as automationDao from './automation.dao.js';
import * as automationService from './automation.service.js';
import { oscServer } from '../../adapters/OscAdapter.js';

export function getAutomationSettings(_req: Request, res: Response<AutomationSettings>) {
  res.json(automationDao.getAutomationSettings());
}

export function postAutomationSettings(req: Request, res: Response<AutomationSettings | ErrorResponse>) {
  try {
    // body payload is a patch object that must contain root properties
    const automationSettings = automationDao.editAutomationSettings({
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

export function postTrigger(req: Request, res: Response<Trigger | ErrorResponse>) {
  try {
    const automation = automationDao.addTrigger({
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

export function putTrigger(req: Request, res: Response<Trigger | ErrorResponse>) {
  try {
    // body payload is a patch object
    const automation = automationDao.editTrigger(req.params.id, {
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

export function deleteTrigger(req: Request, res: Response<void | ErrorResponse>) {
  try {
    automationDao.deleteTrigger(req.params.id);
    res.status(204).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function postAutomation(req: Request, res: Response<Automation | ErrorResponse>) {
  try {
    const newAutomation = automationDao.addAutomation({
      title: req.body.title,
      filterRule: req.body.filterRule,
      filters: req.body.filters,
      outputs: req.body.outputs,
    });
    res.status(201).send(newAutomation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function editAutomation(req: Request, res: Response<Automation | ErrorResponse>) {
  try {
    const newAutomation = automationDao.editAutomation(req.params.id, {
      title: req.body.title,
      filterRule: req.body.filterRule,
      filters: req.body.filters,
      outputs: req.body.outputs,
    });
    res.status(200).send(newAutomation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function deleteAutomation(req: Request, res: Response<void | ErrorResponse>) {
  try {
    automationDao.deleteAutomation(req.params.id);
    res.status(204).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function testOutput(req: Request, res: Response<void | ErrorResponse>) {
  try {
    const payload = req.body as AutomationOutput;
    automationService.testOutput(payload);
    res.status(200).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
