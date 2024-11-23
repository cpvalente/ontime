import { getErrorMessage } from 'ontime-utils';
import { Automation, AutomationBlueprint, AutomationOutput, AutomationSettings, ErrorResponse } from 'ontime-types';

import type { Request, Response } from 'express';

import * as automationDao from './automation.dao.js';
import * as automationService from './automation.service.js';

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
      automations: req.body.automations ?? undefined,
      blueprints: req.body.blueprints ?? undefined,
    });
    res.status(200).send(automationSettings);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function postAutomation(req: Request, res: Response<Automation | ErrorResponse>) {
  try {
    const automation = automationDao.addAutomation({
      title: req.body.title,
      trigger: req.body.trigger,
      blueprintId: req.body.blueprintId,
    });
    res.status(201).send(automation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function putAutomation(req: Request, res: Response<Automation | ErrorResponse>) {
  try {
    // body payload is a patch object
    const automation = automationDao.editAutomation(req.params.id, {
      title: req.body.title ?? undefined,
      trigger: req.body.trigger ?? undefined,
      blueprintId: req.body.blueprintId ?? undefined,
    });
    res.status(200).send(automation);
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

export function postBlueprint(req: Request, res: Response<AutomationBlueprint | ErrorResponse>) {
  try {
    const newBlueprint = automationDao.addBlueprint({
      title: req.body.title,
      filterRule: req.body.filterRule,
      filters: req.body.filters,
      outputs: req.body.outputs,
    });
    res.status(201).send(newBlueprint);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function editBlueprint(req: Request, res: Response<AutomationBlueprint | ErrorResponse>) {
  try {
    const newBlueprint = automationDao.editBlueprint(req.params.id, {
      title: req.body.title,
      filterRule: req.body.filterRule,
      filters: req.body.filters,
      outputs: req.body.outputs,
    });
    res.status(200).send(newBlueprint);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function deleteBlueprint(req: Request, res: Response<void | ErrorResponse>) {
  try {
    automationDao.deleteBlueprint(req.params.id);
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
