import { getErrorMessage } from 'ontime-utils';
import { ErrorResponse } from 'ontime-types';

import type { Request, Response } from 'express';

import * as automationService from './automation.service.js';
import { Automation, AutomationOutput } from './automation.service.js';

export function getAutomations(_req: Request, res: Response<Automation[]>) {
  res.json(automationService.getAutomations());
}

export function postAutomation(req: Request, res: Response<Automation[] | ErrorResponse>) {
  try {
    const automation = req.body as Automation;
    const allAutomations = automationService.addAutomations([automation]);
    res.status(201).send(allAutomations);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function putAutomation(req: Request, res: Response<Automation[] | ErrorResponse>) {
  try {
    const automation = req.body as Automation;
    const allAutomations = automationService.addAutomations([automation]);
    res.status(201).send(allAutomations);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function deleteAutomation(req: Request, res: Response<Automation[] | ErrorResponse>) {
  try {
    const id = req.params.id;
    const allAutomations = automationService.deleteAutomation(id);
    res.status(204).send(allAutomations);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export function testAutomation(req: Request, res: Response<void | ErrorResponse>) {
  try {
    const payload = req.body as AutomationOutput;
    automationService.testOutput(payload);
    res.status(200).send();
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
