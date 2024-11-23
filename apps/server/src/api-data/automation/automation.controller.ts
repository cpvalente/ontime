import { getErrorMessage } from 'ontime-utils';
import {
  Automation,
  AutomationBlueprint,
  AutomationDTO,
  AutomationOutput,
  AutomationSettings,
  ErrorResponse,
} from 'ontime-types';

import type { Request, Response } from 'express';

import * as automationDao from './automation.dao.js';
import * as automationService from './automation.service.js';

export function getAutomationSettings(_req: Request, res: Response<AutomationSettings>) {
  res.json(automationDao.getAutomationSettings());
}

export function postAutomationSettings(req: Request, res: Response<AutomationSettings | ErrorResponse>) {
  try {
    const automationSettings = automationDao.editAutomationSettings(req.body as AutomationSettings);
    res.status(200).send(automationSettings);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function postAutomation(req: Request, res: Response<Automation | ErrorResponse>) {
  try {
    const automation = automationDao.addAutomation(req.body as AutomationDTO);
    res.status(201).send(automation);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function putAutomation(req: Request, res: Response<Automation | ErrorResponse>) {
  try {
    const automation = automationDao.editAutomation(req.params.id, req.body as AutomationDTO);
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
    const blueprint = req.body as AutomationBlueprint;
    const newBlueprint = automationDao.addBlueprint(blueprint);
    res.status(201).send(newBlueprint);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function editBlueprint(req: Request, res: Response<AutomationBlueprint | ErrorResponse>) {
  try {
    const blueprint = req.body as AutomationBlueprint;
    const blueprintId = req.params.id;
    const newBlueprint = automationDao.editBlueprint(blueprintId, blueprint);
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
