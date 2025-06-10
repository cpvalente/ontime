import type { Response } from 'express';

import { isEmptyObject } from './parserUtils.js';

/**
 * @description initial checks for an empty of malformed request object
 * @param obj
 * @param res
 * @deprecated
 */
export const failEmptyObjects = (obj: object, res: Response): boolean => {
  try {
    if (isEmptyObject(obj)) {
      res.status(400).send('No object found in request');
      return true;
    }
  } catch (error) {
    res.status(400).send(error);
    return true;
  }
  return false;
};

/**
 * @description initial checks for an empty of malformed request object
 * @param obj
 * @param res
 * @deprecated
 */
export const failIsNotArray = (obj: object, res: Response): boolean => {
  try {
    if (!Array.isArray(obj)) {
      res.status(400).send('No array found in request');
      return true;
    }
  } catch (error) {
    res.status(400).send(error);
    return true;
  }
  return false;
};
